import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { useMining } from "../hooks/useMining";
import { useState, useEffect, useRef } from "react";
import { useThemeLanguage } from "../contexts/ThemeLanguageContext";
import { useTranslation } from "../lib/translations";
import { SettingsDialog } from "./SettingsDialog";
import { useHapticFeedback } from "../hooks/useHapticFeedback";
import { useWebRTC } from "../hooks/useWebRTC";
import { useToast } from "@/hooks/use-toast";

interface MiningDashboardProps {
  userId: string;
}

export function MiningDashboard({ userId }: MiningDashboardProps) {
  const { mining, currentBlock, startMining, stopMining, onlineMiners, peers, broadcast, totalNetworkProgress, lastProgress } = useMining(userId);
  const { language } = useThemeLanguage();
  const t = useTranslation(language);
  const [peerHashrates, setPeerHashrates] = useState<Record<string, number>>({});
  const [peerStatus, setPeerStatus] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);
  const [peerProgress, setPeerProgress] = useState<Record<string, number>>({});
  const [currentHashrate, setCurrentHashrate] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('');
  const { toast } = useToast();
  const intervalId = useRef<NodeJS.Timeout>();
  const hashrateIntervalId = useRef<NodeJS.Timeout>();
  const { impactOccurred } = useHapticFeedback();
  const { notificationOccurred } = useHapticFeedback();


  useEffect(() => {
    if (mining) {
      // Начальное состояние майнинга
      const startMining = () => {
        const activePeers = Object.entries(peerStatus).filter(([_, status]) => status).length;
        const speedMultiplier = Math.max(1, activePeers + 1);
        
        // Dispatch event about active miners count change
        window.dispatchEvent(new CustomEvent('miners-count-changed', { 
          detail: { count: activePeers + 1 } // +1 for current miner
        }));

        // Обновление хэшрейта каждую секунду
        hashrateIntervalId.current = setInterval(() => {
          const currentHashrate = estimateHashrate();
          setCurrentHashrate(currentHashrate);
          
          const time = calculateEstimatedTime(
            currentHashrate,
            currentBlock?.difficulty || 0,
            activePeers
          );
          
          setEstimatedTime(time > 60 
            ? `${(time / 60).toFixed(1)} min`
            : `${time.toFixed(1)} sec`
          );
          
          // Отправляем обновление хэшрейта другим майнерам
          broadcast({ type: 'hashrate', value: currentHashrate, peerId: userId });
        }, 1000);

        intervalId.current = setInterval(() => {
          setProgress(p => {
            const increment = speedMultiplier * (Math.random() * 0.5 + 0.1);
            const newProgress = Math.min(p + increment, 100);
            
            try {
              // Отправляем обновление прогресса другим майнерам
              broadcast({ type: 'progress', value: newProgress, peerId: userId });
            } catch (error) {
              console.error('Failed to broadcast progress:', error);
            }
            
            return newProgress;
          });
        }, 50);
      };

      startMining();

      return () => {
        if (intervalId.current) clearInterval(intervalId.current);
        if (hashrateIntervalId.current) clearInterval(hashrateIntervalId.current);
      };
    } else {
      setProgress(0);
      setPeerProgress({});
      setCurrentHashrate(0);
      setEstimatedTime('');
      if (intervalId.current) clearInterval(intervalId.current);
      if (hashrateIntervalId.current) clearInterval(hashrateIntervalId.current);
    }
  }, [mining, onlineMiners, broadcast, userId, currentBlock]);

  // Оценка хэшрейта устройства (MH/s)
  const estimateHashrate = () => {
    const iterations = 1000;
    const testData = "test_block_data";
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(testData + i));
    }

    const endTime = performance.now();
    const timeInSeconds = (endTime - startTime) / 1000;
    const hashrate = iterations / timeInSeconds / 1000000; // Convert to MH/s
    return hashrate;
  };

  // Расчет примерного времени майнинга
  useEffect(() => {
    if (mining && currentBlock && currentHashrate > 0) {
      const activePeers = Object.entries(peerStatus).filter(([_, status]) => status).length;
      const time = calculateEstimatedTime(currentHashrate, currentBlock.difficulty, activePeers);
      setEstimatedTime(time > 60 ? `${(time / 60).toFixed(1)} min` : `${time.toFixed(1)} sec`);
    }
  }, [mining, currentBlock, currentHashrate, peerStatus]);

  const calculateEstimatedTime = (hashrate: number, difficulty: number, activePeers: number) => {
    const targetHashes = Math.pow(2, difficulty);
    const totalHashrate = hashrate * (1 + (activePeers * 0.8)); // Учитываем бонус от пиров
    const estimatedSeconds = targetHashes / (totalHashrate * 1000000);
    return estimatedSeconds;
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-background/80 backdrop-blur border-muted">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center justify-between">
            <CardTitle>{t('mining.dashboard')}</CardTitle>
            <SettingsDialog onSettingsChange={(newSettings) => {
              // Применяем новые настройки
              console.log('Settings updated:', newSettings);
            }} />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{onlineMiners} {t('mining.online')}</span>
            </div>
            <div className="flex items-center gap-2 relative group">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full opacity-20 animate-ping" />
              </div>
              <span>{peers.length} {t('mining.peers')}</span>

              {/* Tooltip со списком пиров */}
              <div className="absolute hidden group-hover:block top-full left-0 mt-2 p-2 bg-black/80 backdrop-blur-sm rounded-lg shadow-lg z-10 min-w-[200px]">
                <div className="text-xs space-y-1">
                  {peers.map((peerId) => (
                    <div key={peerId} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${peerStatus[peerId] ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="font-mono">{peerId.slice(0, 8)}...</span>
                        {peerHashrates[peerId] && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round(peerHashrates[peerId])} H/s
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {peers.length === 0 && (
                    <div className="text-muted-foreground">{t('mining.noActivePeers')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{t('mining.currentBlock')}</span>
            <span className="text-sm text-muted-foreground font-mono">
              {currentBlock?.hash.slice(0, 10)}...
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{t('mining.difficulty')}</span>
            <span className="text-sm text-muted-foreground">
              {currentBlock?.difficulty || 0}
            </span>
          </div>

          {mining && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Network Progress</span>
                  <span className="text-sm text-muted-foreground">
                    Network Boost: x{Object.entries(peerStatus).filter(([_, status]) => status).length + 1}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{t('mining.networkHashrate')}: {(currentHashrate + Object.values(peerHashrates).reduce((sum, rate) => sum + rate, 0)).toFixed(2)} MH/s</span>
                  <span>{t('mining.estimatedTime')}: {estimatedTime}</span>
                </div>
                <Progress
                  value={totalNetworkProgress}
                  className="h-2 relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-pulse"
                    style={{
                      width: `${progress}%`,
                      transition: 'width 0.1s ease-out'
                    }}
                  />
                </Progress>
              </div>

              {Object.entries(peerProgress).length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Peer Progress</span>
                  {Object.entries(peerProgress).map(([peerId, value]) => (
                    <div key={peerId} className="space-y-1">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Peer {peerId.slice(0, 8)}...</span>
                        <span>{Math.round(value)}%</span>
                      </div>
                      <Progress
                        value={value}
                        className="h-1.5 relative overflow-hidden"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600"
                          style={{
                            width: `${value}%`,
                            transition: 'width 0.1s ease-out'
                          }}
                        />
                      </Progress>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!mining && (
            <div className="space-y-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Estimated Hashrate</span>
                <span className="text-sm text-muted-foreground">
                  {estimateHashrate().toFixed(2)} MH/s
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Est. Mining Time</span>
                <span className="text-sm text-muted-foreground">
                  {estimatedTime || 'Not estimated yet'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Network Boost</span>
                <span className="text-sm text-muted-foreground">
                  x{(1 + (Object.entries(peerStatus).filter(([_, status]) => status).length * 0.8)).toFixed(1)}
                </span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => {
              impactOccurred('medium');
              if (mining) {
                toast({
                  title: t('mining.miningStopped'),
                  description: t('mining.miningStoppedDesc'),
                  variant: "destructive"
                });
                stopMining();
                window.dispatchEvent(new CustomEvent('mining-state-changed', {
                  detail: { mining: false }
                }));
              } else {
                toast({
                  title: t('mining.miningStarted'),
                  description: t('mining.miningStartedDesc'),
                  variant: "default"
                });
                startMining();
                window.dispatchEvent(new CustomEvent('mining-state-changed', {
                  detail: { mining: true }
                }));
              }
            }}
            variant={mining ? "destructive" : "default"}
          >
            {mining ? t('mining.stopMining') : t('mining.startMining')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}