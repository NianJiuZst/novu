import { StepTypeEnum, WorkflowCreationSourceEnum } from '@novu/shared';
import { WorkflowTemplate } from '../types';

export const invitationTemplate: WorkflowTemplate = {
  id: 'invitation',
  name: 'invitation',
  description: 'Invite users to join your app',
  category: 'authentication',
  isPopular: false,
  workflowDefinition: {
    name: 'invitation',
    description: 'Invite users to join your app',
    workflowId: 'invitation',
    steps: [
      {
        name: 'Email Step',
        type: StepTypeEnum.EMAIL,
        controlValues: {
          body: '{"type":"doc","content":[{"type":"image","attrs":{"src":"https://raw.githubusercontent.com/iampearceman/Design-assets/4f1f8c7fedda5b7fb6058bba66b132bce5d676cb/logos/Acme%20Logo.svg","alt":null,"title":null,"width":110,"height":46,"alignment":"left","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/You%20Are%20Invited%20-%20Email%20Header.png?raw=true","alt":null,"title":null,"width":"500","height":"200","alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"heading","attrs":{"textAlign":"center","level":1,"showIfKey":null},"content":[{"type":"text","text":"You\'re invited to join Acme! 🎉"}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"Hi there,"}]},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"This invitation is valid for "},{"type":"variable","attrs":{"id":"payload.invitation.expires_in_days","label":null,"fallback":null,"required":false}},{"type":"text","marks":[{"type":"bold"}],"text":" days"},{"type":"text","text":"—don\'t miss out!"}]},{"type":"button","attrs":{"text":"Accept invitation","isTextVariable":false,"url":"https://payload.action_url","isUrlVariable":false,"alignment":"center","variant":"filled","borderRadius":"smooth","buttonColor":"#000000","textColor":"#ffffff","showIfKey":null,"paddingTop":10,"paddingRight":32,"paddingBottom":10,"paddingLeft":32}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"If the button doesn\'t work, you can also accept your invitation by clicking "},{"type":"text","marks":[{"type":"link","attrs":{"href":"payload.action_url","target":"_blank","rel":"noopener noreferrer nofollow","class":"mly-no-underline","isUrlVariable":true}},{"type":"underline"}],"text":"this link"},{"type":"text","text":"."}]},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"Looking forward to having you on board!"},{"type":"hardBreak"},{"type":"text","marks":[{"type":"bold"}],"text":"- The Acme Team"}]},{"type":"horizontalRule"},{"type":"image","attrs":{"src":"https://github.com/novuhq/blog/blob/main/media-assets/yelp-footer.png?raw=true","alt":null,"title":null,"width":654,"height":65.19938650306749,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"footer","attrs":{"textAlign":"center","maily-component":"footer"},"content":[{"type":"text","text":"© 2024 | Acme Inc., 350 Mission Street, San Francisco, CA 94105, U.S.A. | "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.yelp.com","target":"_blank","rel":"noopener noreferrer nofollow","class":"mly-no-underline","isUrlVariable":false}}],"text":"www.acme.com"}]}]}',
          subject: "You're Invited to Join {{payload.app_name}}",
        },
      },
    ],
    tags: ['Clerk'],
    active: true,
    __source: WorkflowCreationSourceEnum.TEMPLATE_STORE,
  },
};
