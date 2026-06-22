"use client";
import Link from "next/link";
import { MoreVertical, Trash2, ImageIcon } from "lucide-react";
import type { Project } from "@/core/domain/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";

export function ProjectCard({
  project,
  cover,
  count,
  onDelete,
}: {
  project: Project;
  cover?: string | null;
  count?: number;
  onDelete?: (id: string) => void;
}) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <Link href={`/projects/${project.id}`}>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={project.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <Link
            href={`/projects/${project.id}`}
            className="block truncate font-medium hover:text-primary"
          >
            {project.title}
          </Link>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatRelative(project.updatedAt)}</span>
            {typeof count === "number" && (
              <Badge variant="secondary" className="text-[10px]">
                {count} генераций
              </Badge>
            )}
          </div>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(project.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
