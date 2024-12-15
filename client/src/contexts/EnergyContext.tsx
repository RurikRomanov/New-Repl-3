import { createContext, useContext, useState, ReactNode } from 'react';

interface EnergyContextType {
  energy: number;
  setEnergy: (energy: number) => void;
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

export function EnergyProvider({ children }: { children: ReactNode }) {
  const [energy, setEnergy] = useState(100);

  return (
    <EnergyContext.Provider value={{ energy, setEnergy }}>
      {children}
    </EnergyContext.Provider>
  );
}

export function useEnergy() {
  const context = useContext(EnergyContext);
  if (context === undefined) {
    throw new Error('useEnergy must be used within a EnergyProvider');
  }
  return context;
}
