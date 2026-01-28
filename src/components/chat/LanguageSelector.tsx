import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/voice-api";

type LanguageSelectorProps = {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
};

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === value) || SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">
            {currentLang.label}
            {currentLang.accent && ` (${currentLang.accent})`}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => onChange(lang.code)}
            className="flex items-center justify-between gap-4"
          >
            <span>
              {lang.label}
              {lang.accent && (
                <span className="text-muted-foreground ml-1">({lang.accent})</span>
              )}
            </span>
            {value === lang.code && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
