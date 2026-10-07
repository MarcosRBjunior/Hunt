import { ArrowUpIcon } from "@/components/ui/icons";
import { formatNumber, plural } from "@/lib/utils";

type UpvoteButtonProps = {
  title: string;
  upvotes: number;
};

/** No nível 1 só exibe os votos; vira interativo (otimista, com login) na Fase 8. */
export function UpvoteButton({ title, upvotes }: UpvoteButtonProps) {
  return (
    <button
      type="button"
      disabled
      aria-label={`Votar em ${title} (${plural(upvotes, "voto", "votos")})`}
      className="relative z-10 flex h-[62px] w-12 flex-col items-center justify-center gap-0.5 justify-self-end rounded-upvote border border-line bg-surface-subtle text-ink-muted sm:w-[54px]"
    >
      <ArrowUpIcon className="size-[19px]" />
      <span className="text-caption font-extrabold">
        {formatNumber(upvotes)}
      </span>
    </button>
  );
}
