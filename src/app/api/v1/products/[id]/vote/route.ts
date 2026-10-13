import { requireUser } from "@/server/auth";
import { ok, withErrorHandling } from "@/server/http";
import { voteService } from "@/server/services/voteService";

type Context = RouteContext<"/api/v1/products/[id]/vote">;

/** Vota (201). Só usuário autenticado, 1 voto por produto (regras 2 a 5). */
export const POST = withErrorHandling(
  async (_request, { params }: Context, log) => {
    const user = await requireUser();
    log.userId = user.userId;

    const { id } = await params;
    return ok(await voteService.vote(user.userId, id), 201);
  },
);

/** Remove o voto (200): o segundo clique do toggle. */
export const DELETE = withErrorHandling(
  async (_request, { params }: Context, log) => {
    const user = await requireUser();
    log.userId = user.userId;

    const { id } = await params;
    return ok(await voteService.unvote(user.userId, id));
  },
);
