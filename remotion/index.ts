import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

/**
 * Ponto de entrada do Remotion, apontado em remotion.config.ts.
 * Este arquivo não é usado pelo Next.js e nunca chega ao bundle do site.
 */
registerRoot(RemotionRoot);
