import { useRef } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UploadButtonGroup({
  accept,
  actionLabel = "Upload",
  countLabel = "Choose file",
  disabled = false,
  onFile,
  onFiles,
  multiple = false,
}: {
  accept: string;
  actionLabel?: string;
  countLabel?: string;
  disabled?: boolean;
  onFile: (file: File | undefined) => void | Promise<void>;
  onFiles?: (files: File[]) => void | Promise<void>;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="inline-flex w-fit max-w-full -space-x-px rounded-md shadow-xs rtl:space-x-reverse">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="border-border/70 gap-2 rounded-none rounded-l-md px-3 shadow-none focus-visible:z-10"
      >
        <UploadIcon className="size-4" />
        {actionLabel}
      </Button>
      <span className="flex max-w-[220px] items-center truncate rounded-r-md border border-border/70 bg-muted/20 px-3 text-sm font-medium text-muted-foreground">
        {countLabel}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-label={actionLabel}
        onChange={async (event) => {
          const input = event.currentTarget;
          const files = Array.from(input.files ?? []);
          input.value = "";
          if (multiple && onFiles) { if (files.length) await onFiles(files); }
          else if (files[0]) await onFile(files[0]);
        }}
      />
    </div>
  );
}
