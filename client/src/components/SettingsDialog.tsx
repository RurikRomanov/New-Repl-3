import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useHapticFeedback } from "../hooks/useHapticFeedback";

interface SettingsDialogProps {
  onSettingsChange?: (settings: {
    enableHaptics: boolean;
    enableNotifications: boolean;
    enableBackgroundMining: boolean;
    language: 'en' | 'ru';
    theme: 'light' | 'dark';
  }) => void;
}

export function SettingsDialog({ onSettingsChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    enableHaptics: true,
    enableNotifications: true,
    enableBackgroundMining: false,
    language: 'ru' as const,
    theme: 'dark' as const,
  });

  const { impactOccurred } = useHapticFeedback();

  const handleSettingChange = (key: keyof typeof settings, value?: any) => {
    impactOccurred('light');
    const newSettings = {
      ...settings,
      [key]: value !== undefined ? value : !settings[key],
    };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mining Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="haptics" className="flex flex-col">
              <span>Haptic Feedback</span>
              <span className="text-sm text-muted-foreground">
                Vibrate on important events
              </span>
            </Label>
            <Switch
              id="haptics"
              checked={settings.enableHaptics}
              onCheckedChange={() => handleSettingChange("enableHaptics")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="flex flex-col">
              <span>Notifications</span>
              <span className="text-sm text-muted-foreground">
                Show mining progress notifications
              </span>
            </Label>
            <Switch
              id="notifications"
              checked={settings.enableNotifications}
              onCheckedChange={() => handleSettingChange("enableNotifications")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="background" className="flex flex-col">
              <span>Background Mining</span>
              <span className="text-sm text-muted-foreground">
                Continue mining when app is in background
              </span>
            </Label>
            <Switch
              id="background"
              checked={settings.enableBackgroundMining}
              onCheckedChange={() => handleSettingChange("enableBackgroundMining")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="language" className="flex flex-col">
              <span>Language / Язык</span>
              <span className="text-sm text-muted-foreground">
                Choose interface language
              </span>
            </Label>
            <Select
              value={settings.language}
              onValueChange={(value: 'en' | 'ru') =>
                handleSettingChange('language', value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="theme" className="flex flex-col">
              <span>Theme / Тема</span>
              <span className="text-sm text-muted-foreground">
                Choose interface theme
              </span>
            </Label>
            <Select
              value={settings.theme}
              onValueChange={(value: 'light' | 'dark') =>
                handleSettingChange('theme', value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
