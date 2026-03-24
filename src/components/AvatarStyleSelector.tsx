import { useState } from 'react';
import { AvatarStyle, AvatarStyleMeta, AVATAR_STYLES, generateAvatar, generateRandomAvatar } from '@/src/utils/avatar';
import { Dices } from 'lucide-react';

interface AvatarStyleSelectorProps {
  seed: string;
  currentStyle: AvatarStyle;
  currentUrl: string;
  onSave: (style: AvatarStyle, url: string) => void;
  saving?: boolean;
}

export function AvatarStyleSelector({
  seed,
  currentStyle,
  currentUrl,
  onSave,
  saving = false,
}: AvatarStyleSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(currentStyle);
  const [previewUrl, setPreviewUrl] = useState<string>(currentUrl);
  const [randomSeed, setRandomSeed] = useState<string>(seed);

  const isDirty = previewUrl !== currentUrl || selectedStyle !== currentStyle;

  function handleSelectStyle(style: AvatarStyle) {
    setSelectedStyle(style);
    setPreviewUrl(generateAvatar(randomSeed, style));
  }

  function handleRandomize() {
    const newSeed = `${seed}-${Date.now()}`;
    setRandomSeed(newSeed);
    setPreviewUrl(generateAvatar(newSeed, selectedStyle));
  }

  function handleSave() {
    onSave(selectedStyle, previewUrl);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Large preview */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="relative">
          <img
            src={previewUrl}
            alt="Avatar preview"
            className="h-24 w-24 rounded-full border-2 border-white/20 shadow-xl object-cover transition-all duration-300"
            referrerPolicy="no-referrer"
          />
          {isDirty && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-yellow-500 border-2 border-black" />
          )}
        </div>
        <button
          onClick={handleRandomize}
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
        >
          <Dices className="h-3.5 w-3.5" />
          Randomize
        </button>
      </div>

      {/* Style grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {AVATAR_STYLES.map((meta: AvatarStyleMeta) => {
          const isSelected = selectedStyle === meta.id;
          const previewSrc = generateAvatar(randomSeed, meta.id);
          return (
            <button
              key={meta.id}
              onClick={() => handleSelectStyle(meta.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                isSelected
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-white/10 bg-zinc-900 hover:border-white/30 hover:bg-zinc-800'
              }`}
            >
              <img
                src={previewSrc}
                alt={meta.label}
                className="h-12 w-12 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="text-center">
                <p className={`text-xs font-bold ${isSelected ? 'text-yellow-400' : 'text-white/70'}`}>
                  {meta.label}
                </p>
                <p className="text-[10px] text-white/30 leading-tight">{meta.description}</p>
              </div>
              {isSelected && (
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!isDirty || saving}
        className={`w-full py-3 rounded-full text-sm font-bold transition-all ${
          isDirty && !saving
            ? 'bg-yellow-500 text-black hover:bg-yellow-400'
            : 'bg-white/10 text-white/30 cursor-not-allowed'
        }`}
      >
        {saving ? 'Saving…' : isDirty ? 'Save Avatar' : 'No Changes'}
      </button>
    </div>
  );
}
