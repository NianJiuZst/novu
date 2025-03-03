import { StepTypeEnum, WorkflowCreationSourceEnum } from '@novu/shared';
import { WorkflowTemplate } from '../types';

export const verificationCodeTemplate: WorkflowTemplate = {
  id: 'verification-code',
  name: 'verification-code',
  description: 'Verify your email',
  category: 'authentication',
  isPopular: false,
  workflowDefinition: {
    name: 'verification-code',
    description: 'Verify your email',
    workflowId: 'verification-code',
    steps: [
      {
        name: 'Email Step',
        type: StepTypeEnum.EMAIL,
        controlValues: {
          body: '{"type":"doc","content":[{"type":"image","attrs":{"src":"https://raw.githubusercontent.com/iampearceman/Design-assets/4f1f8c7fedda5b7fb6058bba66b132bce5d676cb/logos/Acme%20Logo.svg","alt":null,"title":null,"width":110,"height":46,"alignment":"left","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/Varify%20Email-%20Email%20Header.png?raw=true","alt":null,"title":null,"width":"500","height":"200","alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"spacer","attrs":{"height":"sm","showIfKey":null}},{"type":"heading","attrs":{"textAlign":"center","level":2,"showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(0, 0, 0)"}},{"type":"bold"}],"text":"Verification Code"}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"Thank you for signing up for Acme"},{"type":"text","marks":[{"type":"bold"}],"text":"!"},{"type":"text","text":" To verify your email, use the code below:"}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"section","attrs":{"borderRadius":6,"backgroundColor":"#f7f7f7","align":"left","borderWidth":0,"borderColor":"#e2e2e2","paddingTop":5,"paddingRight":5,"paddingBottom":5,"paddingLeft":5,"marginTop":0,"marginRight":0,"marginBottom":0,"marginLeft":0,"showIfKey":null},"content":[{"type":"heading","attrs":{"textAlign":"center","level":1,"showIfKey":null},"content":[{"type":"variable","attrs":{"id":"payload.otp_code","label":null,"fallback":null,"required":false}},{"type":"text","text":" "}]}]},{"type":"paragraph","attrs":{"textAlign":"center","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(151, 151, 151)"}},{"type":"bold"}],"text":"For your security, do not share this code with anyone."}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"This request was made from"},{"type":"text","marks":[{"type":"bold"}],"text":" "},{"type":"variable","attrs":{"id":"payload.requested_from","label":null,"fallback":null,"required":true}},{"type":"text","text":", at"},{"type":"variable","attrs":{"id":"payload.requested_at","label":null,"fallback":null,"required":true},"marks":[{"type":"bold"}]},{"type":"text","text":"."}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"section","attrs":{"borderRadius":6,"backgroundColor":"#f7f7f7","align":"left","borderWidth":0,"borderColor":"#e2e2e2","paddingTop":5,"paddingRight":5,"paddingBottom":5,"paddingLeft":5,"marginTop":0,"marginRight":0,"marginBottom":0,"marginLeft":0,"showIfKey":null},"content":[{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"If you did not request this, you can safely ignore this email. Your account will remain unverified until you complete the verification process. "}]}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"Stay secure,"},{"type":"hardBreak"},{"type":"text","marks":[{"type":"bold"}],"text":"The Acme Team"}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/novuhq/blog/blob/main/media-assets/yelp-footer.png?raw=true","alt":null,"title":null,"width":654,"height":65.19938650306749,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"footer","attrs":{"textAlign":"center","maily-component":"footer"},"content":[{"type":"text","text":"© 2024 | Acme Inc., 350 Mission Street, San Francisco, CA 94105, U.S.A. | "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.yelp.com","target":"_blank","rel":"noopener noreferrer nofollow","class":"mly-no-underline","isUrlVariable":false}}],"text":"www.acme.com"}]}]}',
          subject: 'Verify Your Email for {{payload.app_name}}',
        },
      },
    ],
    tags: ['Clerk'],
    active: true,
    __source: WorkflowCreationSourceEnum.TEMPLATE_STORE,
  },
};
