import { useEffect, useState } from "react";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";

interface RenameDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  dialogTitle: string;
  initialValue: string;
  onSave: (newTitle: string) => void;
}

// Shared by ChaptersView and ScenesView — both need the identical "rename
// this entity" shape (title + Save/Cancel), just pointed at a different
// backend command by the caller.
export function RenameDialog({
  isOpen,
  onOpenChange,
  dialogTitle,
  initialValue,
  onSave,
}: RenameDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  const handleSave = () => {
    onSave(value);
    onOpenChange(false);
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form">
      <DialogHeader title={dialogTitle} onOpenChange={onOpenChange} />
      <VStack gap={4} padding={4}>
        <TextInput label="Başlık" value={value} onChange={setValue} />
        <HStack gap={2} justify="end">
          <Button label="Kaydet" variant="primary" clickAction={handleSave} isDisabled={!value} />
          <Button label="Vazgeç" variant="secondary" clickAction={() => onOpenChange(false)} />
        </HStack>
      </VStack>
    </Dialog>
  );
}
