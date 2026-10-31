"use client"

import { toast } from "sonner"
import { CalendarIcon, SparklesIcon, XIcon, ChevronRightIcon, LockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { InfoBox } from "@/components/ui/info-box"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

function SheetOption({
  icon,
  title,
  description,
  danger = false,
}: {
  icon: React.ReactNode
  title: string
  description: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      className="bg-surface-2 hover:bg-elevated flex w-full items-center gap-4 rounded-md p-4 text-left transition-colors"
    >
      <span
        className={
          danger
            ? "bg-error/15 text-error flex size-11 shrink-0 items-center justify-center rounded-sm [&_svg]:size-5"
            : "bg-magenta-500/18 flex size-11 shrink-0 items-center justify-center rounded-sm text-pink-300 [&_svg]:size-5"
        }
      >
        {icon}
      </span>
      <span className="flex flex-1 flex-col">
        <span className={danger ? "type-body-medium text-error" : "type-body-medium"}>{title}</span>
        <span className="type-body text-secondary-txt">{description}</span>
      </span>
      <ChevronRightIcon className="text-muted-txt size-5" aria-hidden />
    </button>
  )
}

export function OverlaysDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary">Abrir sheet (M8)</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar agendamento</SheetTitle>
            <SheetDescription>Alongamento em gel · Qui, 5/11 às 14:15</SheetDescription>
          </SheetHeader>
          <SheetBody className="pb-6">
            <SheetOption
              icon={<CalendarIcon />}
              title="Trocar dia ou horário"
              description="Escolha outro horário livre"
            />
            <SheetOption
              icon={<SparklesIcon />}
              title="Trocar serviço"
              description="Horários recalculados pela nova duração"
            />
            <SheetOption
              icon={<XIcon />}
              title="Cancelar agendamento"
              description="Gratuito até 24 h antes"
              danger
            />
          </SheetBody>
        </SheetContent>
      </Sheet>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Abrir modal (A4)</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear ou liberar horários</DialogTitle>
            <DialogDescription>
              Escolha mês, dia ou faixa de horário. Os horários somem da agenda da cliente assim que
              você aplicar.
            </DialogDescription>
          </DialogHeader>
          <InfoBox tone="info" icon={<LockIcon />}>
            Nenhum agendamento nesse período.
          </InfoBox>
          <DialogFooter>
            <Button variant="secondary">Cancelar</Button>
            <Button>Aplicar bloqueio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="soft" onClick={() => toast.success("Horário confirmado!")}>
        Toast de sucesso
      </Button>
      <Button variant="soft" onClick={() => toast.error("Esse horário acabou de ser ocupado.")}>
        Toast de erro
      </Button>
    </div>
  )
}
