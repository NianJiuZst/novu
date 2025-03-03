import { StepTypeEnum, WorkflowCreationSourceEnum } from '@novu/shared';
import { WorkflowTemplate } from '../types';

export const resetPasswordTemplate: WorkflowTemplate = {
  id: 'reset-password-code',
  name: 'reset-password-code',
  description: 'Reset your password',
  category: 'authentication',
  isPopular: false,
  workflowDefinition: {
    name: 'reset-password-code',
    description: 'Reset your password',
    workflowId: 'reset-password-code',
    steps: [
      {
        name: 'Email Step',
        type: StepTypeEnum.EMAIL,
        controlValues: {
          body: '{"type":"doc","content":[{"type":"image","attrs":{"src":"https://raw.githubusercontent.com/iampearceman/Design-assets/0b935b2c5135040415302931fefaf9648142083a/logos/Acme%20Logo.svg","alt":null,"title":null,"width":110,"height":46,"alignment":"left","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"spacer","attrs":{"height":"sm","showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/(Key)%20Password%20Reset%20-%20Email%20Header.png?raw=true","alt":null,"title":null,"width":"500","height":"200","alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"heading","attrs":{"textAlign":"center","level":2,"showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(84, 84, 84)"}},{"type":"bold"}],"text":"Password Reset Code for Acme Inc."}]},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(122, 122, 122)"}}],"text":"We received a request to reset your password for Acme Inc. Use the code below to complete the process"}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"section","attrs":{"borderRadius":6,"backgroundColor":"#f7f7f7","align":"left","borderWidth":0,"borderColor":"#e2e2e2","paddingTop":5,"paddingRight":5,"paddingBottom":5,"paddingLeft":5,"marginTop":0,"marginRight":0,"marginBottom":0,"marginLeft":0,"showIfKey":null},"content":[{"type":"heading","attrs":{"textAlign":"center","level":1,"showIfKey":null},"content":[{"type":"variable","attrs":{"id":"payload.otp_code","label":null,"fallback":null,"required":false}},{"type":"text","text":" "}]}]},{"type":"paragraph","attrs":{"textAlign":"center","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(151, 151, 151)"}},{"type":"bold"}],"text":"For your security, do not share this code with anyone."}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(122, 122, 122)"}}],"text":"This request was made from"},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(122, 122, 122)"}},{"type":"bold"}],"text":" "},{"type":"variable","attrs":{"id":"payload.requested_from","label":null,"fallback":null,"required":true}},{"type":"text","text":", at"},{"type":"variable","attrs":{"id":"payload.requested_at","label":null,"fallback":null,"required":true},"marks":[{"type":"bold"}]},{"type":"text","text":"."}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"section","attrs":{"borderRadius":0,"backgroundColor":"","align":"left","borderWidth":0,"borderColor":"","paddingTop":0,"paddingRight":0,"paddingBottom":0,"paddingLeft":0,"marginTop":0,"marginRight":0,"marginBottom":0,"marginLeft":0,"showIfKey":null},"content":[{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(122, 122, 122)"}}],"text":"If you did not request this, we strongly recommend resetting your password immediately and enabling multi-factor authentication in the "},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(122, 122, 122)"}},{"type":"bold"}],"text":"\\"My Account\\""},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(122, 122, 122)"}}],"text":" section under "},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(122, 122, 122)"}},{"type":"bold"}],"text":"Settings"},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(122, 122, 122)"}}],"text":"."}]}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(147, 147, 147)"}}],"text":"Stay secure,"},{"type":"hardBreak","marks":[{"type":"textStyle","attrs":{"color":"rgb(147, 147, 147)"}}]},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(147, 147, 147)"}}],"text":"The Acme Inc. Team"}]},{"type":"image","attrs":{"src":"https://github.com/novuhq/blog/blob/main/media-assets/yelp-footer.png?raw=true","alt":null,"title":null,"width":654,"height":65.19938650306749,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"footer","attrs":{"textAlign":"center","maily-component":"footer"},"content":[{"type":"text","text":"© 2024 | Acme Inc., 350 Mission Street, San Francisco, CA 94105, U.S.A. | "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.yelp.com","target":"_blank","rel":"noopener noreferrer nofollow","class":"mly-no-underline","isUrlVariable":false}}],"text":"www.acme.com"}]}]}',
          subject: '{{payload.otp_code}} Is Your Password Reset Code',
        },
      },
      {
        name: 'SMS Step',
        type: StepTypeEnum.SMS,
        controlValues: {
          body: '{{payload.app_name}} Password Reset Code:\n\nYour reset code: {{payload.otp_code}}\n\nFor security, do not share this code.',
        },
      },
    ],
    tags: ['Clerk'],
    active: true,
    __source: WorkflowCreationSourceEnum.TEMPLATE_STORE,
  },
};
