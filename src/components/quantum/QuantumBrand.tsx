import React from 'react';

/**
 * Colourful geometric brand mark + "GIAP" wordmark, echoing the multi-colour
 * Quantum "Q" lockup from the reference portal but built for the Geospatial
 * Integrated Analysis Portal.
 */
export function QuantumBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative grid grid-cols-2 grid-rows-2 gap-[2px] w-7 h-7 rotate-0">
        <span className="rounded-tl-md rounded-br-[2px]" style={{ background: '#F57C1F' }} />
        <span className="rounded-tr-md" style={{ background: '#1C6DB5' }} />
        <span className="rounded-bl-md" style={{ background: '#4A90D9' }} />
        <span className="rounded-br-md rounded-tl-[2px]" style={{ background: '#16A34A' }} />
      </div>
      {!compact && (
        <div className="leading-none">
          <span className="block text-[20px] font-black tracking-tight text-quantum-blue-darker">
            SIGA
          </span>
        </div>
      )}
    </div>
  );
}

export default QuantumBrand;
