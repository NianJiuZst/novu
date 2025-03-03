import { StepTypeEnum, WorkflowCreationSourceEnum } from '@novu/shared';
import { WorkflowTemplate } from '../types';

export const magicLinkSignInTemplate: WorkflowTemplate = {
  id: 'magic-link-sign-in',
  name: 'magic-link-sign-in',
  description: 'Sign in to your app using a magic link',
  category: 'authentication',
  isPopular: false,
  workflowDefinition: {
    name: 'magic-link-sign-in',
    description: 'Sign in to your app using a magic link',
    workflowId: 'magic-link-sign-in',
    steps: [
      {
        name: 'Email Step',
        type: StepTypeEnum.EMAIL,
        controlValues: {
          body: '{"type":"doc","content":[{"type":"image","attrs":{"src":"https://raw.githubusercontent.com/iampearceman/Design-assets/4f1f8c7fedda5b7fb6058bba66b132bce5d676cb/logos/Acme%20Logo.svg","alt":null,"title":null,"width":110,"height":46,"alignment":"left","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/(Door)%20Magic%20Link-%20Email%20Header.png?raw=true","alt":null,"title":null,"width":"500","height":"200","alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"spacer","attrs":{"height":"sm","showIfKey":null}},{"type":"heading","attrs":{"textAlign":"center","level":2,"showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(0, 0, 0)"}},{"type":"bold"}],"text":"Sign in to "},{"type":"text","marks":[{"type":"bold"}],"text":"Acme "}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Hi there,"}]},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"You requested to sign in to "},{"type":"variable","attrs":{"id":"payload.app.name","label":null,"fallback":null,"required":false}},{"type":"text","text":". Click the button below to proceed."}]},{"type":"button","attrs":{"text":"Sign In","isTextVariable":false,"url":"https://payload.magic_link","isUrlVariable":false,"alignment":"center","variant":"filled","borderRadius":"smooth","buttonColor":"#000000","textColor":"#ffffff","showIfKey":null,"paddingTop":10,"paddingRight":32,"paddingBottom":10,"paddingLeft":32}},{"type":"paragraph","attrs":{"textAlign":"center","showIfKey":null},"content":[{"type":"text","text":"This link will expire in "},{"type":"variable","attrs":{"id":"payload.ttl_minutes","label":null,"fallback":null,"required":false}},{"type":"text","text":" minutes."}]},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"If the button doesn’t work, you can "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://payload.magic_link","target":"_blank","rel":"noopener","class":"mly-no-underline","isUrlVariable":false}},{"type":"bold"},{"type":"underline"}],"text":"click here"},{"type":"text","text":" to sign in manually."}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"section","attrs":{"borderRadius":0,"backgroundColor":"#f8f8f8","align":"left","borderWidth":2,"borderColor":"#e2e2e2","paddingTop":5,"paddingRight":5,"paddingBottom":5,"paddingLeft":5,"marginTop":0,"marginRight":0,"marginBottom":0,"marginLeft":0,"showIfKey":null},"content":[{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Didn\'t request this?"},{"type":"hardBreak"},{"type":"text","text":"This sign-in link was requested by "},{"type":"variable","attrs":{"id":"payload.requested_by","label":null,"fallback":null,"required":false}},{"type":"text","text":" from "},{"type":"variable","attrs":{"id":"payload.requested_from","label":null,"fallback":null,"required":false}},{"type":"text","text":" at "},{"type":"variable","attrs":{"id":"payload.requested_at","label":null,"fallback":null,"required":false}},{"type":"text","text":". If you didn’t initiate this request, you can safely ignore this email."}]}]},{"type":"spacer","attrs":{"height":"md","showIfKey":null}},{"type":"horizontalRule"},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"- The Acme Team"}]},{"type":"image","attrs":{"src":"https://github.com/novuhq/blog/blob/main/media-assets/yelp-footer.png?raw=true","alt":null,"title":null,"width":654,"height":65.19938650306749,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"footer","attrs":{"textAlign":"center","maily-component":"footer"},"content":[{"type":"text","text":"© 2024 | Acme Inc., 350 Mission Street, San Francisco, CA 94105, U.S.A. | "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.yelp.com","target":"_blank","rel":"noopener noreferrer nofollow","class":"mly-no-underline","isUrlVariable":false}}],"text":"www.acme.com"}]}]}',
          subject: 'Your Sign-in Link for {{payload.app.name}}',
        },
      },
    ],
    tags: ['Clerk'],
    active: true,
    __source: WorkflowCreationSourceEnum.TEMPLATE_STORE,
  },
};
