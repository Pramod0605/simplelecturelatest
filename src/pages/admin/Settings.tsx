import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAISettings, useUpdateAISettings, AISettings } from "@/hooks/useAISettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Sparkles } from "lucide-react";

export default function Settings() {
  const { data: aiSettings, isLoading } = useAISettings();
  const updateSettings = useUpdateAISettings();
  
  const [localSettings, setLocalSettings] = useState<AISettings | null>(null);

  useEffect(() => {
    if (aiSettings) {
      setLocalSettings(aiSettings);
    }
  }, [aiSettings]);

  const handleSaveAI = () => {
    if (localSettings) {
      updateSettings.mutate(localSettings);
    }
  };
  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure basic application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="site-name">Site Name</Label>
            <Input id="site-name" defaultValue="SimpleLecture" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site-description">Site Description</Label>
            <Input id="site-description" defaultValue="Online Learning Platform" />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable maintenance mode to prevent user access
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email notifications to users
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow New Registrations</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to register
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>AI Question Generation Settings</CardTitle>
              <CardDescription>Configure AI model and parameters for automatic question generation</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading || !localSettings ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ai-model">AI Model</Label>
                  <Select
                    value={localSettings.model}
                    onValueChange={(value) => setLocalSettings({ ...localSettings, model: value })}
                  >
                    <SelectTrigger id="ai-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="google/gemini-2.5-flash">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Gemini 2.5 Flash (Recommended)
                        </div>
                      </SelectItem>
                      <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                      <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
                      <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                      <SelectItem value="openai/gpt-5-nano">GPT-5 Nano</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the AI model for question generation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questions-per-topic">Questions per Topic</Label>
                  <Input
                    id="questions-per-topic"
                    type="number"
                    min="1"
                    max="50"
                    value={localSettings.questions_per_topic}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      questions_per_topic: parseInt(e.target.value)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of questions to generate per topic
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature: {localSettings.temperature}</Label>
                  <Input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localSettings.temperature}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      temperature: parseFloat(e.target.value)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls randomness (0 = focused, 1 = creative)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-tokens">Max Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    min="500"
                    max="4000"
                    step="100"
                    value={localSettings.max_tokens}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      max_tokens: parseInt(e.target.value)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum response length
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Difficulty Distribution (%)</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="easy" className="text-sm font-normal">Easy</Label>
                    <Input
                      id="easy"
                      type="number"
                      min="0"
                      max="100"
                      value={localSettings.difficulty_distribution.easy}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        difficulty_distribution: {
                          ...localSettings.difficulty_distribution,
                          easy: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medium" className="text-sm font-normal">Medium</Label>
                    <Input
                      id="medium"
                      type="number"
                      min="0"
                      max="100"
                      value={localSettings.difficulty_distribution.medium}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        difficulty_distribution: {
                          ...localSettings.difficulty_distribution,
                          medium: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hard" className="text-sm font-normal">Hard</Label>
                    <Input
                      id="hard"
                      type="number"
                      min="0"
                      max="100"
                      value={localSettings.difficulty_distribution.hard}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        difficulty_distribution: {
                          ...localSettings.difficulty_distribution,
                          hard: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Distribution should total 100%
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  rows={6}
                  value={localSettings.system_prompt}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    system_prompt: e.target.value
                  })}
                  placeholder="Enter the system prompt for AI question generation..."
                />
                <p className="text-xs text-muted-foreground">
                  Instructions for the AI model when generating questions
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => aiSettings && setLocalSettings(aiSettings)}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSaveAI}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? "Saving..." : "Save AI Settings"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Configure payment gateway settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Payment gateway configuration coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
