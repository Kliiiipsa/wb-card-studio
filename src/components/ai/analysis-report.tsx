"use client";
import {
  Stethoscope,
  AlertTriangle,
  ShieldX,
  CheckCircle2,
  ListChecks,
  Lightbulb,
  Type,
  Palette,
  Rocket,
} from "lucide-react";
import type { AnalysisReport as Report } from "@/core/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "./score-card";
import { CARD_TYPE_MAP } from "@/core/domain/card-types";

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-primary">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span className="text-foreground/80">{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function AnalysisReportView({ report }: { report: Report }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Section icon={<Stethoscope className="h-4 w-4" />} title="Короткий диагноз">
          <p className="text-foreground/80">{report.diagnosis}</p>
        </Section>

        <Section icon={<AlertTriangle className="h-4 w-4" />} title="Главная проблема">
          <p className="text-foreground/80">{report.mainProblem}</p>
        </Section>

        <div className="grid gap-4 md:grid-cols-2">
          <Section icon={<ShieldX className="h-4 w-4" />} title="Что мешает покупке">
            <List items={report.blockersToPurchase} />
          </Section>
          <Section icon={<CheckCircle2 className="h-4 w-4" />} title="Что хорошо">
            <List items={report.whatWorks} />
          </Section>
        </div>

        <Section icon={<ListChecks className="h-4 w-4" />} title="Исправить в первую очередь">
          <List items={report.fixFirst} />
        </Section>

        <div className="grid gap-4 md:grid-cols-2">
          <Section icon={<Type className="h-4 w-4" />} title="Рекомендации по текстам">
            <List items={report.textTips} />
          </Section>
          <Section icon={<Palette className="h-4 w-4" />} title="Рекомендации по визуалу">
            <List items={report.visualTips} />
          </Section>
        </div>

        <Section icon={<Lightbulb className="h-4 w-4" />} title="Идеи новых карточек">
          <div className="grid gap-2 sm:grid-cols-2">
            {report.newCardIdeas.map((idea, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="text-xs font-medium text-primary">
                  {CARD_TYPE_MAP[idea.cardType as keyof typeof CARD_TYPE_MAP]?.title ?? idea.cardType}
                </div>
                <div className="mt-0.5 text-sm font-medium text-foreground">{idea.title}</div>
                <p className="mt-1 text-xs">{idea.angle}</p>
                {idea.headline && (
                  <p className="mt-1.5 text-xs italic text-foreground/70">«{idea.headline}»</p>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section icon={<Rocket className="h-4 w-4" />} title="План улучшений">
          <List items={report.improvementPlan} />
        </Section>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Оценка карточки</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreCard score={report.scores} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
