export const buildOauthRedirectUrl = (request): string => {
  let url = `${process.env.DASHBOARD_URL || process.env.FRONT_BASE_URL}/auth/login`;

  if (!request.user || !request.user.token) {
    return `${url}?error=AuthenticationError`;
  }

  let state: Record<string, string> = {};
  try {
    state = JSON.parse(request.query?.state) ?? {};
  } catch {
    state = {};
  }

  const { redirectUrl } = state;

  /**
   * Make sure we only allow localhost redirects for CLI use and our own success route
   * https://github.com/novuhq/novu/security/code-scanning/3
   */
  if (redirectUrl && redirectUrl.startsWith('http://127.0.0.1:') && !redirectUrl.includes('@')) {
    url = redirectUrl;
  }

  url += `?token=${request.user.token}`;

  if (request.user.newUser) {
    url += '&newUser=true';
  }

  /**
   * partnerCode, next and configurationId are required during external partners integration
   * such as vercel integration etc
   */
  if (state.partnerCode) {
    url += `&code=${state.partnerCode}`;
  }

  if (state.next) {
    url += `&next=${state.next}`;
  }

  if (state.configurationId) {
    url += `&configurationId=${state.configurationId}`;
  }

  if (state.invitationToken) {
    url += `&invitationToken=${state.invitationToken}`;
  }

  if (state.isLoginPage) {
    url += `&isLoginPage=${state.isLoginPage}`;
  }

  return url;
};
