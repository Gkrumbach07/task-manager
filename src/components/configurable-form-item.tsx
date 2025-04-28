"use client";

import React, { useState, type ReactNode } from "react";
import { Settings, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormItem, FormLabel } from "@/components/ui/form"; // Assuming you're using shadcn Form

type ConfigurableFormItemProps = {
  title: string;
  isConfigured: boolean;
  onSave: () => boolean | Promise<boolean> | void; // Triggered when the checkmark is clicked
  onEdit?: () => void; // Optional: Triggered when the edit/configure button is clicked
  onCancel?: () => void; // Optional: Triggered when the X is clicked
  children: ReactNode; // The form fields to show when editing
  previewContent?: ReactNode; // Content to display when configured and not editing
};

export const ConfigurableFormItem: React.FC<ConfigurableFormItemProps> = ({
  title,
  isConfigured,
  onSave,
  onEdit,
  onCancel,
  children,
  previewContent,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    }
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    const result = await Promise.resolve(onSave());
    if (result !== false) {
      setIsEditing(false);
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    }
    setIsEditing(false);
  };

  return (
    <FormItem className="space-y-1">
      {/* Header Row - Always visible, content changes */}
      <div className="flex justify-between items-center">
        <FormLabel
          className={`text-sm ${
            !isEditing && !isConfigured ? "text-destructive italic" : ""
          } ${!isEditing && isConfigured ? "italic" : ""}`}
        >
          {!isEditing && !isConfigured
            ? `${title} has not been configured.`
            : !isEditing && isConfigured
            ? `${title} is configured.`
            : title}
          {/* Show plain title when editing */}
        </FormLabel>

        {/* Edit Button (only shows when not editing) */}
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditClick}
            aria-label={isConfigured ? `Edit ${title}` : `Configure ${title}`}
            className="h-6 w-6 flex-shrink-0" // Added flex-shrink-0
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content Area - Switches between preview and edit box */}
      {isEditing ? (
        <div className="rounded-md border p-4 pt-2 space-y-2 relative">
          {/* Save/Cancel Buttons inside top-right */}
          <div className="absolute top-1 right-1 flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveClick}
              aria-label={`Save ${title}`}
              className="h-6 w-6 text-green-600 hover:text-green-700"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelClick}
              aria-label={`Cancel editing ${title}`}
              className="h-6 w-6 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Form elements passed as children */}
          <div className="pt-4">
            {" "}
            {/* Added padding-top to avoid overlap */}
            {children}
          </div>
        </div>
      ) : (
        // Preview Content (only shows when not editing and configured)
        isConfigured &&
        previewContent && (
          <div className="pt-1 text-sm text-muted-foreground">
            {previewContent}
          </div>
        )
      )}
    </FormItem>
  );
};
