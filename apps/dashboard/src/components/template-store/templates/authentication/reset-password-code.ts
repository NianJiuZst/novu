import { StepTypeEnum, WorkflowCreationSourceEnum } from '@novu/shared';
import { IntegrationType } from '../../../icons/integrations';
import { WorkflowTemplate } from '../types';

export const resetPasswordCodeTemplate: WorkflowTemplate = {
  id: 'reset-password-code',
  name: 'Reset Password Code',
  description: 'Send a code to allow password reset',
  category: 'authentication',
  isPopular: false,
  workflowDefinition: {
    name: 'Reset Password Code',
    description: 'Send a code to allow password reset',
    workflowId: 'reset-password-code',
    steps: [
      {
        name: 'Email Step',
        type: StepTypeEnum.EMAIL,
        controlValues: {
          body: '{"type":"doc","content":[{"type":"section","attrs":{"borderRadius":0,"backgroundColor":"","align":"left","borderWidth":0,"borderColor":"","paddingTop":0,"paddingRight":0,"paddingBottom":0,"paddingLeft":0,"marginTop":0,"marginRight":0,"marginBottom":0,"marginLeft":0,"showIfKey":null},"content":[{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/Colored%20Header%20-%20Email%20Header.png?raw=true","alt":null,"title":null,"width":654,"height":65.4,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"spacer","attrs":{"height":16,"showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/Acme%20Company%20Logo%20(Color).png?raw=true","alt":null,"title":null,"width":200,"height":41,"alignment":"left","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"spacer","attrs":{"height":16,"showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/reset-password-header%20-%20Email%20Header.png?raw=true","alt":null,"title":null,"width":500,"height":200,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"spacer","attrs":{"height":16,"showIfKey":null}},{"type":"heading","attrs":{"textAlign":"center","level":2,"showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(0, 0, 0)"}},{"type":"bold"}],"text":"Reset Your Password"}]},{"type":"spacer","attrs":{"height":16,"showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"We received a request to reset your password. Use the code below to reset it:"}]},{"type":"spacer","attrs":{"height":32,"showIfKey":null}},{"type":"section","attrs":{"borderRadius":6,"backgroundColor":"#f7f7f7","align":"left","borderWidth":0,"borderColor":"#e2e2e2","paddingTop":16,"paddingRight":16,"paddingBottom":16,"paddingLeft":16,"marginTop":0,"marginRight":0,"marginBottom":0,"marginLeft":0,"showIfKey":null},"content":[{"type":"heading","attrs":{"textAlign":"center","level":1,"showIfKey":null},"content":[{"type":"variable","attrs":{"id":"payload.data.reset_code","label":null,"fallback":null,"required":true},"marks":[{"type":"textStyle","attrs":{"color":"#000000"}}]}]}]},{"type":"paragraph","attrs":{"textAlign":"center","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(151, 151, 151)"}}],"text":"This code will expire in 15 minutes."}]},{"type":"spacer","attrs":{"height":32,"showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"If you didn\'t request this change, please ignore this email or contact our support team immediately if you have concerns about your account security."}]},{"type":"spacer","attrs":{"height":32,"showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(34, 45, 56)"}}],"text":"Stay secure,"},{"type":"hardBreak","marks":[{"type":"textStyle","attrs":{"color":"rgb(34, 45, 56)"}}]},{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(34, 45, 56)"}}],"text":"Acme Security Team"}]},{"type":"image","attrs":{"src":"https://github.com/novuhq/blog/blob/main/media-assets/yelp-footer.png?raw=true","alt":null,"title":null,"width":654,"height":65.19938650306749,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"rgb(34, 45, 56)"}}],"text":"© 2025 | Acme Inc., 350 Mission Street, San Francisco, CA 94105, U.S.A. | "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.acme.com","target":"_blank","rel":"noopener noreferrer nofollow","class":"mly-no-underline","isUrlVariable":false}},{"type":"textStyle","attrs":{"color":"rgb(10, 189, 159)"}}],"text":"www.acme.com"}]},{"type":"spacer","attrs":{"height":16,"showIfKey":null}}]},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/Colored%20Footer%20-%20Email%20Footer.png?raw=true","alt":null,"title":null,"width":654,"height":65.4,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}}]}',
          subject: 'Reset Your Password',
        },
      },
    ],
    tags: ['clerk'],
    active: true,
    __source: WorkflowCreationSourceEnum.TEMPLATE_STORE,
  },
  integration: IntegrationType.CLERK,
};
