"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Eye } from "lucide-react";

type MarkdownProps = {
  content: string;
  onSave?: (newContent: string) => void;
  readOnly?: boolean;
};

export function Markdown({ content, onSave, readOnly = false }: MarkdownProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleSave = () => {
    onSave?.(editContent);
    setIsEditing(false);
  };

  if (isEditing && !readOnly) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="min-h-[200px] font-mono"
          placeholder="Write your content in markdown format..."
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {!readOnly && (
        <div className="absolute right-0 top-0">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isCodeBlock =
              match &&
              props.node?.position?.start.line !==
                props.node?.position?.end.line;
            return isCodeBlock ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
