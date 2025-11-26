import sanitizeTypes, { IOptions } from 'sanitize-html';

/**
 * Options for the sanitize-html library.
 *
 * We are providing a permissive approach by default, with the exception of
 * disabling `script` tags and dangerous event handler attributes.
 *
 * @see https://www.npmjs.com/package/sanitize-html#default-options
 */
const DANGEROUS_ATTRIBUTES = [
  'onerror',
  'onload',
  'onabort',
  'onafterprint',
  'onanimationend',
  'onanimationiteration',
  'onanimationstart',
  'onbeforeprint',
  'onbeforeunload',
  'onblur',
  'oncanplay',
  'oncanplaythrough',
  'onchange',
  'onclick',
  'oncontextmenu',
  'oncopy',
  'oncut',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onended',
  'onerror',
  'onfocus',
  'onfocusin',
  'onfocusout',
  'onfullscreenchange',
  'onfullscreenerror',
  'onhashchange',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onload',
  'onloadeddata',
  'onloadedmetadata',
  'onloadstart',
  'onmessage',
  'onmousedown',
  'onmouseenter',
  'onmouseleave',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onmousewheel',
  'onoffline',
  'ononline',
  'onpagehide',
  'onpageshow',
  'onpaste',
  'onpause',
  'onplay',
  'onplaying',
  'onpopstate',
  'onprogress',
  'onratechange',
  'onresize',
  'onreset',
  'onscroll',
  'onsearch',
  'onseeked',
  'onseeking',
  'onselect',
  'onshow',
  'onstalled',
  'onstorage',
  'onsubmit',
  'onsuspend',
  'ontimeupdate',
  'ontoggle',
  'ontouchcancel',
  'ontouchend',
  'ontouchmove',
  'ontouchstart',
  'ontransitionend',
  'onunload',
  'onvolumechange',
  'onwaiting',
  'onwheel',
];

const allowedTags = sanitizeTypes.defaults.allowedTags.concat([
  'style',
  'img',
  'html',
  'head',
  'body',
  'link',
  'meta',
  'title',
]);

const stripDangerousAttributes = (attribs: Record<string, string>): Record<string, string> => {
  const safeAttribs: Record<string, string> = {};

  for (const [key, value] of Object.entries(attribs)) {
    if (!DANGEROUS_ATTRIBUTES.includes(key.toLowerCase())) {
      safeAttribs[key] = value;
    }
  }

  return safeAttribs;
};

const transformTags = allowedTags.reduce((acc, tag) => {
  acc[tag] = (tagName: string, attribs: Record<string, string>) => ({
    tagName,
    attribs: stripDangerousAttributes(attribs),
  });

  return acc;
}, {} as Record<string, (tagName: string, attribs: Record<string, string>) => { tagName: string; attribs: Record<string, string> }>);

const sanitizeOptions: IOptions = {
  /**
   * Additional tags to allow.
   */
  allowedTags,
  allowedAttributes: false,
  /**
   * Transform all tags to strip dangerous event handler attributes (onerror, onload, etc.)
   * while keeping all other attributes permissive.
   */
  transformTags,
  /**
   * Additional URL schemes to allow in src, href, and other URL attributes.
   * Including 'cid:' for Content-ID references used in email attachments.
   */
  allowedSchemes: sanitizeTypes.defaults.allowedSchemes.concat(['cid']),
  /**
   * Required to disable console warnings when allowing style tags.
   *
   * We are allowing style tags to support the use of styles in the In-App Editor.
   * This is a known security risk through an XSS attack vector,
   * but we are accepting this risk by dropping support for IE11.
   *
   * @see https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html#remote-style-sheet
   */
  allowVulnerableTags: true,
  /**
   * Required to disable formatting of style attributes. This is useful to retain
   * formatting of style attributes in the In-App Editor.
   */
  parseStyleAttributes: false,
  parser: {
    // Convert the case of attribute names to lowercase.
    lowerCaseAttributeNames: true,
  },
};

export const sanitizeHTML = (html: string): string => {
  if (!html) {
    return html;
  }

  // Sanitize-html removes the DOCTYPE tag, so we need to add it back.
  const doctypeRegex = /^<!DOCTYPE .*?>/;
  const doctypeTags = html.match(doctypeRegex);
  const cleanHtml = sanitizeTypes(html, sanitizeOptions);

  const cleanHtmlWithDocType = doctypeTags ? doctypeTags[0] + cleanHtml : cleanHtml;

  return cleanHtmlWithDocType;
};

export const sanitizeHtmlInObject = <T extends Record<string, unknown>>(object: T): T => {
  return Object.keys(object).reduce((acc, key: keyof T) => {
    const value = object[key];

    if (typeof value === 'string') {
      acc[key] = sanitizeHTML(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      acc[key] = value.map((item) => {
        if (typeof item === 'string') {
          return sanitizeHTML(item);
        } else if (typeof item === 'object') {
          return sanitizeHtmlInObject(item);
        } else {
          return item;
        }
      }) as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      acc[key] = sanitizeHtmlInObject(value as Record<string, unknown>) as T[keyof T];
    } else {
      acc[key] = value;
    }

    return acc;
  }, {} as T);
};
