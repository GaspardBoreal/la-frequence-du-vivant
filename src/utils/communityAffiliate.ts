const AFFILIATE_STORAGE_KEY = 'mdv_affiliate_token';

export const getAffiliateInviteUrl = (shareToken: string) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/marches-du-vivant/rejoindre/${shareToken}`;
};

export const storeAffiliateToken = (token: string) => {
  localStorage.setItem(AFFILIATE_STORAGE_KEY, token);
};

export const getStoredAffiliateToken = () => localStorage.getItem(AFFILIATE_STORAGE_KEY);

export const clearStoredAffiliateToken = () => localStorage.removeItem(AFFILIATE_STORAGE_KEY);

export const buildAffiliateCopyMessage = ({
  explorationName,
  inviteUrl,
}: {
  explorationName?: string;
  inviteUrl: string;
}) => `J’ai pensé à toi en marchant${explorationName ? ` dans « ${explorationName} »` : ''} — et promis, aucune obligation de parler aux arbres dès le premier jour 🌿

Les Marcheurs du Vivant, c’est une communauté qui reconnecte positivement les générations au vivant, donne envie d’aller voir dehors plutôt que de se replier, et transforme la curiosité en aventures sensibles, scientifiques et narratives.

Concrètement, on y explore :
• la biodiversité et la bioacoustique sans jargon assommant
• des récits collectifs inspirants mêlant sciences, arts narratifs et attention au présent
• des marches sur le terrain, des formations et des outils Open Source / Open Science / Creative Commons

Le tout pour mieux rencontrer le vivant, ne plus en craindre l’évolution, et contribuer à une communauté joyeusement sérieuse.

Si le cœur t’en dit, voici ton passage secret vers la communauté :
${inviteUrl}`;

export const buildAffiliateShareMessage = ({
  explorationName,
  inviteUrl,
}: {
  explorationName?: string;
  inviteUrl: string;
}) => `Je t’invite à découvrir les Marcheurs du Vivant${explorationName ? ` via « ${explorationName} »` : ''} 🌿
Une communauté qui mêle biodiversité, bioacoustique, géopoétique et science participative — sans pollution informationnelle.

${inviteUrl}`;