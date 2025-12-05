import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Volume2, CheckCircle, XCircle, Info, Save, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVoiceSettings, useUpdateVoiceSettings, DEFAULT_VOICE_SETTINGS, RECOMMENDED_VOICES } from "@/hooks/useVoiceSettings";

interface VoiceInfo {
  voice: SpeechSynthesisVoice;
  quality: "neural" | "standard" | "basic";
  isIndian: boolean;
  isFemale: boolean;
  language: "english" | "hindi" | "other";
}

// Known Indian voice names for filtering
const INDIAN_VOICE_IDENTIFIERS = [
  'google हिन्दी', 'heera', 'hemant', 'ravi', 'neerja', 'aditi', 
  'prabhat', 'hindi', 'india', '-in'
];

const SAMPLE_TEXTS = {
  english: `Hello! I'm your education counselor at SimpleLecture. Dr. Nagpal's mission is to bring quality education to every student in India. Our courses are completely FREE, with just a ₹2,000 registration fee.`,
  hindi: `नमस्ते! मैं सिंपललेक्चर में आपकी शिक्षा सलाहकार हूं। डॉ. नागपाल का मिशन है हर छात्र को गुणवत्तापूर्ण शिक्षा प्रदान करना। हमारे कोर्स पूरी तरह मुफ्त हैं, बस ₹2,000 रजिस्ट्रेशन फीस है।`,
};

export default function VoiceTester() {
  const [allVoices, setAllVoices] = useState<VoiceInfo[]>([]);
  const [indianVoices, setIndianVoices] = useState<VoiceInfo[]>([]);
  const [englishVoices, setEnglishVoices] = useState<VoiceInfo[]>([]);
  const [hindiVoices, setHindiVoices] = useState<VoiceInfo[]>([]);
  
  // Settings state
  const [selectedEnglishVoice, setSelectedEnglishVoice] = useState("");
  const [selectedHindiVoice, setSelectedHindiVoice] = useState("");
  const [englishRate, setEnglishRate] = useState([DEFAULT_VOICE_SETTINGS.englishRate]);
  const [englishPitch, setEnglishPitch] = useState([DEFAULT_VOICE_SETTINGS.englishPitch]);
  const [hindiRate, setHindiRate] = useState([DEFAULT_VOICE_SETTINGS.hindiRate]);
  const [hindiPitch, setHindiPitch] = useState([DEFAULT_VOICE_SETTINGS.hindiPitch]);
  
  const [testText, setTestText] = useState(SAMPLE_TEXTS.english);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({ name: "", supportsRecognition: false, supportsSynthesis: false });
  
  const { toast } = useToast();
  const { data: savedSettings, isLoading: loadingSettings } = useVoiceSettings();
  const updateSettings = useUpdateVoiceSettings();

  // Detect browser
  useEffect(() => {
    const ua = navigator.userAgent;
    let browserName = "Unknown";
    
    if (ua.includes("Edg/")) browserName = "Microsoft Edge";
    else if (ua.includes("Chrome/")) browserName = "Google Chrome";
    else if (ua.includes("Safari/") && !ua.includes("Chrome")) browserName = "Safari";
    else if (ua.includes("Firefox/")) browserName = "Firefox";
    
    const supportsRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    const supportsSynthesis = 'speechSynthesis' in window;
    
    setBrowserInfo({ name: browserName, supportsRecognition, supportsSynthesis });
  }, []);

  // Load voices - filter to Indian only
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
        const isIndian = lang.includes("-in") || lang === "hi" ||
                        INDIAN_VOICE_IDENTIFIERS.some(id => name.includes(id) || lang.includes(id));
        
        // Determine language type
        let language: "english" | "hindi" | "other" = "other";
        if (lang.startsWith("en") && isIndian) {
          language = "english";
        } else if (lang.startsWith("hi") || name.includes("hindi") || name.includes("हिन्दी")) {
          language = "hindi";
        } else if (lang.startsWith("en")) {
          // Include Google English voices as they work well
          if (name.includes("google")) {
            language = "english";
          }
        }
        
        // Check if female voice
        const femaleNames = ['aditi', 'heera', 'neerja', 'priya', 'female', 'woman', 'zira', 'samantha', 'raveena'];
        const isFemale = femaleNames.some(n => name.includes(n));
        
        return { voice, quality, isIndian, isFemale, language };
      });
      
      setAllVoices(voiceInfos);
      
      // Filter to Indian accent voices only
      const indian = voiceInfos.filter(v => 
        v.isIndian || v.language === "hindi" || 
        (v.language === "english" && v.voice.name.toLowerCase().includes("google"))
      );
      
      // Sort: Neural > Standard > Basic, Female first
      indian.sort((a, b) => {
        const qualityOrder = { neural: 0, standard: 1, basic: 2 };
        if (a.isFemale !== b.isFemale) return a.isFemale ? -1 : 1;
        return qualityOrder[a.quality] - qualityOrder[b.quality];
      });
      
      setIndianVoices(indian);
      
      // Separate English and Hindi voices
      const english = indian.filter(v => v.language === "english" || 
        (v.voice.lang.toLowerCase().startsWith("en") && !v.voice.lang.toLowerCase().includes("gb")));
      const hindi = indian.filter(v => v.language === "hindi" || 
        v.voice.lang.toLowerCase().startsWith("hi"));
      
      setEnglishVoices(english);
      setHindiVoices(hindi);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Load saved settings
  useEffect(() => {
    if (savedSettings && !loadingSettings) {
      setSelectedEnglishVoice(savedSettings.englishVoiceName);
      setSelectedHindiVoice(savedSettings.hindiVoiceName);
      setEnglishRate([savedSettings.englishRate]);
      setEnglishPitch([savedSettings.englishPitch]);
      setHindiRate([savedSettings.hindiRate]);
      setHindiPitch([savedSettings.hindiPitch]);
    }
  }, [savedSettings, loadingSettings]);

  // Auto-select best voices when voices load
  useEffect(() => {
    if (englishVoices.length > 0 && !selectedEnglishVoice) {
      // Try to find recommended voice first
      const recommended = englishVoices.find(v => 
        RECOMMENDED_VOICES.english.some(r => v.voice.name.includes(r.split(" ")[0]))
      );
      setSelectedEnglishVoice(recommended?.voice.name || englishVoices[0]?.voice.name || "");
    }
    
    if (hindiVoices.length > 0 && !selectedHindiVoice) {
      const googleHindi = hindiVoices.find(v => v.voice.name.toLowerCase().includes("google"));
      setSelectedHindiVoice(googleHindi?.voice.name || hindiVoices[0]?.voice.name || "");
    }
  }, [englishVoices, hindiVoices, selectedEnglishVoice, selectedHindiVoice]);

  const playVoice = (language: "english" | "hindi") => {
    window.speechSynthesis.cancel();
    
    const text = language === "hindi" ? SAMPLE_TEXTS.hindi : SAMPLE_TEXTS.english;
    const voiceName = language === "hindi" ? selectedHindiVoice : selectedEnglishVoice;
    const rate = language === "hindi" ? hindiRate[0] : englishRate[0];
    const pitch = language === "hindi" ? hindiPitch[0] : englishPitch[0];
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    const voices = language === "hindi" ? hindiVoices : englishVoices;
    const voiceInfo = voices.find(v => v.voice.name === voiceName);
    if (voiceInfo) {
      utterance.voice = voiceInfo.voice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const playCustomText = () => {
    if (!testText.trim()) {
      toast({ title: "No text", description: "Please enter some text to speak", variant: "destructive" });
      return;
    }

    window.speechSynthesis.cancel();
    
    // Detect if Hindi text
    const isHindi = /[\u0900-\u097F]/.test(testText);
    const voiceName = isHindi ? selectedHindiVoice : selectedEnglishVoice;
    const rate = isHindi ? hindiRate[0] : englishRate[0];
    const pitch = isHindi ? hindiPitch[0] : englishPitch[0];
    
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    const voices = isHindi ? hindiVoices : englishVoices;
    const voiceInfo = voices.find(v => v.voice.name === voiceName);
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

  const saveSettings = () => {
    updateSettings.mutate({
      englishVoiceName: selectedEnglishVoice,
      hindiVoiceName: selectedHindiVoice,
      englishRate: englishRate[0],
      englishPitch: englishPitch[0],
      hindiRate: hindiRate[0],
      hindiPitch: hindiPitch[0],
    });
  };

  const hasChanges = savedSettings && (
    savedSettings.englishVoiceName !== selectedEnglishVoice ||
    savedSettings.hindiVoiceName !== selectedHindiVoice ||
    savedSettings.englishRate !== englishRate[0] ||
    savedSettings.englishPitch !== englishPitch[0] ||
    savedSettings.hindiRate !== hindiRate[0] ||
    savedSettings.hindiPitch !== hindiPitch[0]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🎙️ Voice Settings</h1>
        <p className="text-muted-foreground">Configure Indian accent voices for the AI Sales Assistant</p>
      </div>

      {/* Browser Compatibility */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Browser: {browserInfo.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Speech Recognition:</span>
              {browserInfo.supportsRecognition ? (
                <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Yes</Badge>
              ) : (
                <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> No</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Text-to-Speech:</span>
              {browserInfo.supportsSynthesis ? (
                <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Yes</Badge>
              ) : (
                <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> No</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Indian Voices:</span>
              <Badge variant="secondary">{indianVoices.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Limitations Explanation */}
      <Card className="border-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-5 w-5 text-amber-500" />
            Voice Limitations & Browser Compatibility
          </CardTitle>
          <CardDescription>
            Not all voices work on all browsers and devices. Here's what you need to know:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Hindi - Recommended */}
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500">✓ Recommended</Badge>
              <h4 className="font-semibold">Google हिन्दी</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              ✅ <strong>Works on all platforms</strong>: Chrome, Edge, Firefox, Safari, Android, iOS.
              Best choice for cross-platform compatibility. This is why we use it for both English and Hindi.
            </p>
          </div>

          {/* Neural Voices */}
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-purple-500">Neural</Badge>
              <h4 className="font-semibold">Microsoft Neural Voices (Neerja Online, Hemant Online)</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ <strong>Only available in Microsoft Edge browser</strong>. 
              These high-quality voices will NOT work in Chrome, Firefox, Safari, or mobile browsers.
              Great quality but limited reach.
            </p>
          </div>

          {/* Windows SAPI Voices */}
          <div className="p-3 bg-muted rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Basic</Badge>
              <h4 className="font-semibold">Windows SAPI Voices (Ravi, Hemant, Heera)</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ <strong>Only available on Windows desktop</strong>.
              Will NOT work on Mac, Linux, iOS, or Android devices.
            </p>
          </div>

          {/* Platform Compatibility Matrix */}
          <div className="mt-4 border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left font-medium">Voice Type</th>
                  <th className="p-2 text-center font-medium">Chrome</th>
                  <th className="p-2 text-center font-medium">Edge</th>
                  <th className="p-2 text-center font-medium">Safari</th>
                  <th className="p-2 text-center font-medium">Firefox</th>
                  <th className="p-2 text-center font-medium">Mobile</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2 font-medium">Google हिन्दी</td>
                  <td className="p-2 text-center text-green-600">✅</td>
                  <td className="p-2 text-center text-green-600">✅</td>
                  <td className="p-2 text-center text-green-600">✅</td>
                  <td className="p-2 text-center text-green-600">✅</td>
                  <td className="p-2 text-center text-green-600">✅</td>
                </tr>
                <tr className="border-t bg-muted/30">
                  <td className="p-2 font-medium">Microsoft Neural</td>
                  <td className="p-2 text-center text-red-500">❌</td>
                  <td className="p-2 text-center text-green-600">✅</td>
                  <td className="p-2 text-center text-red-500">❌</td>
                  <td className="p-2 text-center text-red-500">❌</td>
                  <td className="p-2 text-center text-red-500">❌</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-medium">Windows SAPI</td>
                  <td className="p-2 text-center text-amber-500">⚠️</td>
                  <td className="p-2 text-center text-amber-500">⚠️</td>
                  <td className="p-2 text-center text-red-500">❌</td>
                  <td className="p-2 text-center text-amber-500">⚠️</td>
                  <td className="p-2 text-center text-red-500">❌</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground p-2 bg-muted border-t">
              ⚠️ = Windows desktop only | ✅ = Fully supported | ❌ = Not available
            </p>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="text-sm">
              <strong>💡 Recommendation:</strong> Use <strong>Google हिन्दी</strong> for both English and Hindi 
              to ensure your AI Sales Assistant works consistently across all user devices and browsers.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            🇮🇳 Indian Voice Settings
            {hasChanges && <Badge variant="outline" className="ml-2">Unsaved Changes</Badge>}
          </CardTitle>
          <CardDescription>
            These settings will be applied to the AI Sales Assistant for all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* English Voice Settings */}
          <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🇬🇧</span>
              <h3 className="font-semibold">English Voice (Indian Accent)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Voice</label>
                <Select value={selectedEnglishVoice} onValueChange={setSelectedEnglishVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select English voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {englishVoices.map((v) => (
                      <SelectItem key={v.voice.name} value={v.voice.name}>
                        <div className="flex items-center gap-2">
                          <span>{v.voice.name}</span>
                          {v.quality === "neural" && <Badge className="bg-purple-500 text-xs">Neural</Badge>}
                          {v.quality === "standard" && <Badge variant="secondary" className="text-xs">Standard</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                    {englishVoices.length === 0 && (
                      <SelectItem value="none" disabled>No English voices found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: Google हिन्दी (works on all browsers/devices)
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rate: {englishRate[0].toFixed(2)}</label>
                  <Slider value={englishRate} onValueChange={setEnglishRate} min={0.5} max={1.5} step={0.05} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Pitch: {englishPitch[0].toFixed(2)}</label>
                  <Slider value={englishPitch} onValueChange={setEnglishPitch} min={0.5} max={1.5} step={0.05} />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => playVoice("english")} 
              variant="outline" 
              className="mt-4"
              disabled={isSpeaking || !selectedEnglishVoice}
            >
              <Play className="h-4 w-4 mr-2" />
              Test English Voice
            </Button>
          </div>

          {/* Hindi Voice Settings */}
          <div className="p-4 border rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🇮🇳</span>
              <h3 className="font-semibold">Hindi Voice (हिन्दी)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Voice</label>
                <Select value={selectedHindiVoice} onValueChange={setSelectedHindiVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Hindi voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {hindiVoices.map((v) => (
                      <SelectItem key={v.voice.name} value={v.voice.name}>
                        <div className="flex items-center gap-2">
                          <span>{v.voice.name}</span>
                          {v.quality === "neural" && <Badge className="bg-purple-500 text-xs">Neural</Badge>}
                          {v.quality === "standard" && <Badge variant="secondary" className="text-xs">Standard</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                    {hindiVoices.length === 0 && (
                      <SelectItem value="none" disabled>No Hindi voices found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: Google हिन्दी (best natural pronunciation)
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rate: {hindiRate[0].toFixed(2)}</label>
                  <Slider value={hindiRate} onValueChange={setHindiRate} min={0.5} max={1.5} step={0.05} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Pitch: {hindiPitch[0].toFixed(2)}</label>
                  <Slider value={hindiPitch} onValueChange={setHindiPitch} min={0.5} max={1.5} step={0.05} />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => playVoice("hindi")} 
              variant="outline" 
              className="mt-4"
              disabled={isSpeaking || !selectedHindiVoice}
            >
              <Play className="h-4 w-4 mr-2" />
              Test Hindi Voice
            </Button>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button 
              onClick={saveSettings} 
              disabled={updateSettings.isPending || !hasChanges}
              className="min-w-[200px]"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateSettings.isPending ? "Saving..." : "Save Voice Settings"}
            </Button>
            {savedSettings && !hasChanges && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Settings saved and active
              </div>
            )}
          </div>

          {/* Current Saved Settings Display */}
          {savedSettings && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-2">Currently Active Settings:</p>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <p>🇬🇧 English: {savedSettings.englishVoiceName || "Default"}</p>
                <p>Rate: {savedSettings.englishRate} | Pitch: {savedSettings.englishPitch}</p>
                <p>🇮🇳 Hindi: {savedSettings.hindiVoiceName || "Default"}</p>
                <p>Rate: {savedSettings.hindiRate} | Pitch: {savedSettings.hindiPitch}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Custom Text */}
      <Card>
        <CardHeader>
          <CardTitle>Test Custom Text</CardTitle>
          <CardDescription>Enter any text to test with current voice settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setTestText(SAMPLE_TEXTS.english)}>
              English Sample
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTestText(SAMPLE_TEXTS.hindi)}>
              Hindi Sample
            </Button>
          </div>
          
          <Textarea 
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to speak..."
            rows={3}
          />
          
          <div className="flex gap-2">
            {isSpeaking ? (
              <Button onClick={stopVoice} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button onClick={playCustomText}>
                <Play className="h-4 w-4 mr-2" />
                Play (Auto-detect language)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Indian Voices List */}
      <Card>
        <CardHeader>
          <CardTitle>🇮🇳 Available Indian Voices ({indianVoices.length})</CardTitle>
          <CardDescription>Only showing voices with Indian accent support</CardDescription>
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
                  <th className="text-left p-2">Test</th>
                </tr>
              </thead>
              <tbody>
                {indianVoices.map((v) => (
                  <tr key={v.voice.name} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {v.voice.name}
                        {v.isFemale && <span>♀</span>}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">
                        {v.language === "hindi" ? "🇮🇳 Hindi" : "🇬🇧 English"}
                      </Badge>
                    </td>
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
                          window.speechSynthesis.cancel();
                          const utterance = new SpeechSynthesisUtterance(
                            v.language === "hindi" ? "नमस्ते, मैं आपकी सहायता कर सकती हूं" : "Hello, I'm here to help you"
                          );
                          utterance.voice = v.voice;
                          utterance.rate = 0.85;
                          window.speechSynthesis.speak(utterance);
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
