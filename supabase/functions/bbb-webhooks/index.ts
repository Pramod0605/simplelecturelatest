import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const contentType = req.headers.get('content-type') || '';
    let eventData: any;

    // BBB can send webhooks as form data or JSON
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const event = formData.get('event');
      eventData = typeof event === 'string' ? JSON.parse(event) : event;
    } else {
      eventData = await req.json();
    }

    console.log('BBB Webhook received:', JSON.stringify(eventData, null, 2));

    // Handle array of events
    const events = Array.isArray(eventData) ? eventData : [eventData];

    for (const event of events) {
      const eventType = event.header?.name || event.event;
      const meetingId = event.data?.id || event.attributes?.meeting?.['external-meeting-id'];
      const internalMeetingId = event.data?.attributes?.meeting?.['internal-meeting-id'] || event.attributes?.meeting?.['internal-meeting-id'];

      console.log(`Processing event: ${eventType} for meeting: ${meetingId}`);

      // Find the scheduled class by meeting ID
      let scheduledClassId: string | null = null;
      
      if (meetingId) {
        // Meeting ID format is "class-{uuid}"
        const match = meetingId.match(/^class-(.+)$/);
        if (match) {
          scheduledClassId = match[1];
        } else {
          // Try to find by bbb_meeting_id
          const { data } = await supabase
            .from('scheduled_classes')
            .select('id')
            .eq('bbb_meeting_id', meetingId)
            .single();
          
          if (data) {
            scheduledClassId = data.id;
          }
        }
      }

      if (!scheduledClassId) {
        console.log('Could not find scheduled class for meeting:', meetingId);
        continue;
      }

      switch (eventType) {
        case 'meeting-created':
        case 'MeetingCreatedEvtMsg': {
          console.log('Meeting created:', scheduledClassId);
          await supabase
            .from('scheduled_classes')
            .update({
              is_live: true,
              live_started_at: new Date().toISOString(),
            })
            .eq('id', scheduledClassId);
          break;
        }

        case 'meeting-ended':
        case 'MeetingEndedEvtMsg': {
          console.log('Meeting ended:', scheduledClassId);
          await supabase
            .from('scheduled_classes')
            .update({
              is_live: false,
              live_ended_at: new Date().toISOString(),
            })
            .eq('id', scheduledClassId);
          break;
        }

        case 'user-joined':
        case 'UserJoinedMeetingEvtMsg': {
          const userData = event.data?.attributes?.user || event.attributes?.user || {};
          const externalUserId = userData['external-user-id'] || userData.externalUserId;
          const userName = userData.name || 'Unknown';
          const role = userData.role || 'VIEWER';

          console.log('User joined:', { scheduledClassId, externalUserId, userName, role });

          if (externalUserId) {
            // Check if this is a valid UUID (student ID)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            
            if (uuidRegex.test(externalUserId)) {
              // Try to upsert attendance record
              const { error } = await supabase
                .from('class_attendance')
                .upsert({
                  scheduled_class_id: scheduledClassId,
                  student_id: externalUserId,
                  status: 'present',
                  joined_at: new Date().toISOString(),
                  marked_at: new Date().toISOString(),
                }, {
                  onConflict: 'scheduled_class_id,student_id',
                });

              if (error) {
                console.error('Error recording attendance:', error);
              }
            }
          }
          break;
        }

        case 'user-left':
        case 'UserLeftMeetingEvtMsg': {
          const userData = event.data?.attributes?.user || event.attributes?.user || {};
          const externalUserId = userData['external-user-id'] || userData.externalUserId;

          console.log('User left:', { scheduledClassId, externalUserId });

          if (externalUserId) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            
            if (uuidRegex.test(externalUserId)) {
              // Get current attendance record
              const { data: attendance } = await supabase
                .from('class_attendance')
                .select('joined_at')
                .eq('scheduled_class_id', scheduledClassId)
                .eq('student_id', externalUserId)
                .single();

              if (attendance) {
                const joinedAt = new Date(attendance.joined_at);
                const leftAt = new Date();
                const durationSeconds = Math.floor((leftAt.getTime() - joinedAt.getTime()) / 1000);

                await supabase
                  .from('class_attendance')
                  .update({
                    left_at: leftAt.toISOString(),
                    duration_seconds: durationSeconds,
                  })
                  .eq('scheduled_class_id', scheduledClassId)
                  .eq('student_id', externalUserId);
              }
            }
          }
          break;
        }

        case 'rap-archive-ended':
        case 'recording-ready': {
          // Recording is ready
          const recordingData = event.data?.attributes?.recording || event.attributes?.recording || {};
          const playbackUrl = recordingData.playback?.format?.url || 
                             recordingData['playback-format']?.url ||
                             null;

          if (playbackUrl) {
            console.log('Recording ready:', { scheduledClassId, playbackUrl });
            
            await supabase
              .from('scheduled_classes')
              .update({
                recording_url: playbackUrl,
                recording_added_at: new Date().toISOString(),
              })
              .eq('id', scheduledClassId);
          }
          break;
        }

        default:
          console.log('Unhandled event type:', eventType);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
