import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface SettingsDialogProps {
  onSettingsChange?: (settings: {
    enableHaptics: boolean;
    enableNotifications: boolean;
    enableBackgroundMining: boolean;
  }) => void;
}

export function SettingsDialog({ onSettingsChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    enableHaptics: true,
    enableNotifications: true,
    enableBackgroundMining: false,
  });

  const handleSettingChange = (key: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
