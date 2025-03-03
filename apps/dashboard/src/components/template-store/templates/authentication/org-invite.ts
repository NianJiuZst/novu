import { StepTypeEnum, WorkflowCreationSourceEnum } from '@novu/shared';
import { WorkflowTemplate } from '../types';

export const orgInviteTemplate: WorkflowTemplate = {
  id: 'organization-invitation',
  name: 'organization-invitation',
  description: 'Invite users to join an organization',
  category: 'authentication',
  isPopular: false,
  workflowDefinition: {
    name: 'organization-invitation',
    description: 'Invite users to join an organization',
    workflowId: 'organization-invitation',
    steps: [
      {
        name: 'Email Step',
        type: StepTypeEnum.EMAIL,
        controlValues: {
          body: '{"type":"doc","content":[{"type":"image","attrs":{"src":"https://raw.githubusercontent.com/iampearceman/Design-assets/4f1f8c7fedda5b7fb6058bba66b132bce5d676cb/logos/Acme%20Logo.svg","alt":null,"title":null,"width":110,"height":46,"alignment":"left","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/Join%20Org-%20Email%20Header.png?raw=true","alt":null,"title":null,"width":"500","height":"200","alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"spacer","attrs":{"height":"sm","showIfKey":null}},{"type":"heading","attrs":{"textAlign":"center","level":2,"showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#747474"}}],"text":"Join "},{"type":"variable","attrs":{"id":"payload.org_name","label":null,"fallback":null,"required":false}},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(116, 116, 116)"}}],"text":" on Acme"}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Hi there,"}]},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"variable","attrs":{"id":"payload.inviter_name","label":null,"fallback":null,"required":false}},{"type":"text","text":" "},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#000000"}}],"text":"has invited you to join the "},{"type":"variable","attrs":{"id":"payload.org_name","label":null,"fallback":null,"required":false}},{"type":"text","text":" "},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#000000"}}],"text":"organization on "},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#000000"}},{"type":"bold"}],"text":"Acme"},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#000000"}}],"text":"."}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"Click the button below to accept your invitation and start collaborating:"}]},{"type":"button","attrs":{"text":"Accept Invitation","isTextVariable":false,"url":"https://payload.action_url","isUrlVariable":false,"alignment":"center","variant":"filled","borderRadius":"smooth","buttonColor":"#000000","textColor":"#ffffff","showIfKey":null,"paddingTop":10,"paddingRight":32,"paddingBottom":10,"paddingLeft":32}},{"type":"paragraph","attrs":{"textAlign":"center","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#878787"}}],"text":"If you\'re having trouble with the above button, "},{"type":"text","marks":[{"type":"link","attrs":{"href":"payload.action_url","target":"_blank","rel":"noopener noreferrer nofollow","class":"mly-no-underline","isUrlVariable":true}},{"type":"textStyle","attrs":{"color":"#878787"}},{"type":"underline"}],"text":"click here"},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#878787"}}],"text":"."}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"Looking forward to having you onboard!"},{"type":"hardBreak"},{"type":"text","marks":[{"type":"bold"}],"text":"- The Acme Team"}]},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/novuhq/blog/blob/main/media-assets/yelp-footer.png?raw=true","alt":null,"title":null,"width":654,"height":65.19938650306749,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"footer","attrs":{"textAlign":"center","maily-component":"footer"},"content":[{"type":"text","text":"© 2024 | Acme Inc., 350 Mission Street, San Francisco, CA 94105, U.S.A. | "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.yelp.com","target":"_blank","rel":"noopener noreferrer nofollow","class":"mly-no-underline","isUrlVariable":false}}],"text":"www.acme.com"}]}]}',
          subject: 'You’re Invited to Join {{payload.org_name}} on Acme',
        },
      },
    ],
    tags: ['Clerk'],
    active: true,
    __source: WorkflowCreationSourceEnum.TEMPLATE_STORE,
  },
};
