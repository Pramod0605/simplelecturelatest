import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Volume2, Mic, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInfo {
  voice: SpeechSynthesisVoice;
  quality: "neural" | "standard" | "basic";
  isIndian: boolean;
  isFemale: boolean;
}

// Persona configurations
const PERSONAS = {
  priya: { name: "Priya", pitch: 1.15, rate: 0.80, description: "Warm & Caring - Gentle and empathetic" },
  ananya: { name: "Ananya", pitch: 1.05, rate: 0.85, description: "Professional - Business-like and confident" },
  kavya: { name: "Kavya", pitch: 1.20, rate: 0.82, description: "Friendly & Young - Energetic and relatable" },
};

const SAMPLE_TEXTS = {
  english: `Hello! I'm your education counselor at SimpleLecture. Dr. Nagpal's mission is to bring quality education to every student in India. Our courses are completely FREE, with just a ₹2,000 registration fee. That's the cost of one meal - for an entire year of expert coaching!`,
  hindi: `नमस्ते! मैं सिंपललेक्चर में आपकी शिक्षा सलाहकार हूं। डॉ. नागपाल का मिशन है हर छात्र को गुणवत्तापूर्ण शिक्षा प्रदान करना। हमारे कोर्स पूरी तरह मुफ्त हैं, बस ₹2,000 रजिस्ट्रेशन फीस है।`,
  question: `Are you preparing for JEE or NEET? I'd love to understand your goals and recommend the perfect course for you!`,
  emotional: `I understand how challenging it can be. Many students feel overwhelmed, but remember - every topper started exactly where you are today. Your determination to seek help shows you're already on the path to success!`,
};

export default function VoiceTester() {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [selectedPersona, setSelectedPersona] = useState<keyof typeof PERSONAS>("priya");
  const [testText, setTestText] = useState(SAMPLE_TEXTS.english);
  const [rate, setRate] = useState([0.80]);
  const [pitch, setPitch] = useState([1.15]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({ name: "", supportsRecognition: false, supportsSynthesis: false });
  const { toast } = useToast();

  // Detect browser and capabilities
  useEffect(() => {
    const ua = navigator.userAgent;
    let browserName = "Unknown";
    
    if (ua.includes("Edg/")) browserName = "Microsoft Edge";
    else if (ua.includes("Chrome/")) browserName = "Google Chrome";
    else if (ua.includes("Safari/") && !ua.includes("Chrome")) browserName = "Safari";
    else if (ua.includes("Firefox/")) browserName = "Firefox";
    else if (ua.includes("Opera/") || ua.includes("OPR/")) browserName = "Opera";
    
    const supportsRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    const supportsSynthesis = 'speechSynthesis' in window;
    
    setBrowserInfo({ name: browserName, supportsRecognition, supportsSynthesis });
  }, []);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      
      const voiceInfos: VoiceInfo[] = availableVoices.map(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        
        // Determine quality
        let quality: "neural" | "standard" | "basic" = "basic";
        if (name.includes("online") || name.includes("neural") || name.includes("natural")) {
          quality = "neural";
        } else if (name.includes("google") || name.includes("microsoft")) {
          quality = "standard";
        }
        
        // Check if Indian voice
        const isIndian = lang.includes("-in") || name.includes("india") || 
                        ['aditi', 'heera', 'hemant', 'ravi', 'neerja', 'prabhat'].some(n => name.includes(n));
        
        // Check if female voice
        const femaleNames = ['aditi', 'heera', 'neerja', 'priya', 'female', 'woman', 'zira', 'samantha', 'siri', 'raveena'];
        const isFemale = femaleNames.some(n => name.includes(n)) || name.includes('female');
        
        return { voice, quality, isIndian, isFemale };
      });
      
      // Sort: Neural > Standard > Basic, Indian first, Female first
      voiceInfos.sort((a, b) => {
        const qualityOrder = { neural: 0, standard: 1, basic: 2 };
        if (a.isIndian !== b.isIndian) return a.isIndian ? -1 : 1;
        if (a.isFemale !== b.isFemale) return a.isFemale ? -1 : 1;
        return qualityOrder[a.quality] - qualityOrder[b.quality];
      });
      
      setVoices(voiceInfos);
      
      // Auto-select best Indian female voice
      const bestVoice = voiceInfos.find(v => v.isIndian && v.isFemale) || voiceInfos[0];
      if (bestVoice) {
        setSelectedVoice(bestVoice.voice.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Update rate/pitch when persona changes
  useEffect(() => {
    const persona = PERSONAS[selectedPersona];
    setRate([persona.rate]);
    setPitch([persona.pitch]);
  }, [selectedPersona]);

  const playVoice = () => {
    if (!testText.trim()) {
      toast({ title: "No text", description: "Please enter some text to speak", variant: "destructive" });
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.rate = rate[0];
    utterance.pitch = pitch[0];
    
    const voiceInfo = voices.find(v => v.voice.name === selectedVoice);
    if (voiceInfo) {
      utterance.voice = voiceInfo.voice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopVoice = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const selectedVoiceInfo = voices.find(v => v.voice.name === selectedVoice);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Voice Tester</h1>
        <p className="text-muted-foreground">Test and compare available voices for the AI Sales Assistant</p>
      </div>

      {/* Browser Compatibility Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Browser Compatibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Browser:</span>
              <Badge variant="outline">{browserInfo.name}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Speech Recognition:</span>
              {browserInfo.supportsRecognition ? (
                <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Supported</Badge>
              ) : (
                <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Not Supported</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Text-to-Speech:</span>
              {browserInfo.supportsSynthesis ? (
                <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Supported</Badge>
              ) : (
                <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Not Supported</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Available Voices:</span>
              <Badge variant="secondary">{voices.length}</Badge>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">Browser Voice Quality Notes:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <strong>Microsoft Edge:</strong> Best quality - has Neural voices (Microsoft Neerja Online, etc.)</li>
              <li>• <strong>Google Chrome:</strong> Good quality - has Google voices</li>
              <li>• <strong>Safari:</strong> Good on macOS/iOS - Siri voices available</li>
              <li>• <strong>Firefox:</strong> Basic Windows SAPI voices only</li>
              <li>• <strong>Internet Explorer:</strong> Not supported</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Persona Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Counselor Personas</CardTitle>
          <CardDescription>Each persona has a unique voice style and personality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(PERSONAS).map(([key, persona]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all ${selectedPersona === key ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                onClick={() => setSelectedPersona(key as keyof typeof PERSONAS)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                      👩
                    </div>
                    <div>
                      <h3 className="font-semibold">{persona.name}</h3>
                      <p className="text-xs text-muted-foreground">{persona.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 text-xs">
                    <Badge variant="outline">Rate: {persona.rate}</Badge>
                    <Badge variant="outline">Pitch: {persona.pitch}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Selection
          </CardTitle>
          <CardDescription>
            {voices.filter(v => v.isIndian).length} Indian voices available, {voices.filter(v => v.isFemale).length} female voices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {voices.map((v) => (
                    <SelectItem key={v.voice.name} value={v.voice.name}>
                      <div className="flex items-center gap-2">
                        <span>{v.voice.name}</span>
                        <Badge variant="outline" className="text-xs">{v.voice.lang}</Badge>
                        {v.quality === "neural" && <Badge className="bg-purple-500 text-xs">Neural</Badge>}
                        {v.isIndian && <Badge className="bg-orange-500 text-xs">🇮🇳</Badge>}
                        {v.isFemale && <Badge className="bg-pink-500 text-xs">♀</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedVoiceInfo && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Selected Voice Info</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedVoiceInfo.voice.name}</p>
                  <p><strong>Language:</strong> {selectedVoiceInfo.voice.lang}</p>
                  <p><strong>Quality:</strong> {selectedVoiceInfo.quality}</p>
                  <p><strong>Local:</strong> {selectedVoiceInfo.voice.localService ? "Yes" : "No (Cloud)"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Rate and Pitch Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Speech Rate: {rate[0].toFixed(2)}
              </label>
              <Slider 
                value={rate} 
                onValueChange={setRate} 
                min={0.5} 
                max={2.0} 
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">0.5 = Very Slow, 1.0 = Normal, 2.0 = Very Fast</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Voice Pitch: {pitch[0].toFixed(2)}
              </label>
              <Slider 
                value={pitch} 
                onValueChange={setPitch} 
                min={0.5} 
                max={2.0} 
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">Lower = Deeper voice, Higher = Higher voice</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Content */}
      <Card>
        <CardHeader>
          <CardTitle>Test Content</CardTitle>
          <CardDescription>Enter text to test or choose a sample</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setTestText(SAMPLE_TEXTS.english)}>
              English Welcome
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTestText(SAMPLE_TEXTS.hindi)}>
              Hindi Welcome
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTestText(SAMPLE_TEXTS.question)}>
              Question
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTestText(SAMPLE_TEXTS.emotional)}>
              Emotional
            </Button>
          </div>
          
          <Textarea 
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to speak..."
            rows={4}
          />
          
          <div className="flex gap-2">
            {isSpeaking ? (
              <Button onClick={stopVoice} variant="destructive" className="w-full">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button onClick={playVoice} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Play Voice ({PERSONAS[selectedPersona].name})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice List */}
      <Card>
        <CardHeader>
          <CardTitle>All Available Voices ({voices.length})</CardTitle>
          <CardDescription>Complete list of voices available in your browser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Voice Name</th>
                  <th className="text-left p-2">Language</th>
                  <th className="text-left p-2">Quality</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {voices.map((v) => (
                  <tr key={v.voice.name} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {v.voice.name}
                        {v.isIndian && <span>🇮🇳</span>}
                        {v.isFemale && <span>♀</span>}
                      </div>
                    </td>
                    <td className="p-2">{v.voice.lang}</td>
                    <td className="p-2">
                      <Badge variant={v.quality === "neural" ? "default" : v.quality === "standard" ? "secondary" : "outline"}>
                        {v.quality}
                      </Badge>
                    </td>
                    <td className="p-2">{v.voice.localService ? "Local" : "Cloud"}</td>
                    <td className="p-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSelectedVoice(v.voice.name);
                          playVoice();
                        }}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}