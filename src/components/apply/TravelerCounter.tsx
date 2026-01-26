import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import SARSymbol from '@/components/ui/SARSymbol';

interface TravelerCounterProps {
  label: string;
  description: string;
  value: number;
  price: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export default function TravelerCounter({
  label,
  description,
  value,
  price,
  min = 0,
  max = 10,
  onChange,
}: TravelerCounterProps) {
  const { direction } = useLanguage();
  
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex-1">
        <div className="font-semibold text-foreground">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
        <div className="text-sm font-medium text-primary mt-1 flex items-center gap-1">
          {price.toLocaleString()}
          <SARSymbol size="xs" className="text-primary" />
          <span className="text-muted-foreground font-normal">
            {direction === 'rtl' ? ' / للشخص' : ' / person'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full",
            value <= min && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <span className="w-8 text-center text-lg font-semibold">{value}</span>
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full",
            value >= max && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
