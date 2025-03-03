import { StepTypeEnum, WorkflowCreationSourceEnum } from '@novu/shared';
import { WorkflowTemplate } from '../types';

export const welcomeTemplate: WorkflowTemplate = {
  id: 'welcome',
  name: 'welcome',
  description: 'Welcome users to your app',
  category: 'authentication',
  isPopular: false,
  workflowDefinition: {
    name: 'welcome',
    description: '',
    workflowId: 'welcome',
    steps: [
      {
        name: 'In-App Step',
        type: StepTypeEnum.IN_APP,
        controlValues: {
          body: "We're thrilled to have you on board! 🚀\n\n{{payload.app_name}} is designed to to make your life easier—and you’re now part of an amazing community.",
          avatar: 'https://dashboard-v2.novu.co/images/confetti.svg',
          subject: 'Welcome',
          redirect: {
            url: '',
            target: '_self',
          },
          disableOutputSanitization: false,
        },
      },
      {
        name: 'Delay Step',
        type: StepTypeEnum.DELAY,
        controlValues: {
          amount: 2,
          unit: 'hours',
          type: 'regular',
        },
      },
      {
        name: 'Email Step',
        type: StepTypeEnum.EMAIL,
        controlValues: {
          body: '{"type":"doc","content":[{"type":"image","attrs":{"src":"https://raw.githubusercontent.com/iampearceman/Design-assets/7d021c55a131983892b178138363260ee2882087/logos/Acme%20Logo.svg","alt":null,"title":null,"width":110,"height":46,"alignment":"left","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/iampearceman/Design-assets/blob/main/emails/Welcome%20-%20Email%20Header.png?raw=true","alt":null,"title":null,"width":"500","height":"200.608695652174","alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"spacer","attrs":{"height":"sm","showIfKey":null}},{"type":"heading","attrs":{"textAlign":"center","level":2,"showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Welcome to Acme!"}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"Hi "},{"type":"variable","attrs":{"id":"subscriber.firstName","label":null,"fallback":null,"required":false}},{"type":"text","text":", We\'re thrilled to have you on board! 🚀 "},{"type":"variable","attrs":{"id":"payload.app_name","label":null,"fallback":null,"required":false}},{"type":"text","text":"is designed to to make your life easier—and you’re now part of an amazing community."}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"heading","attrs":{"textAlign":"left","level":3,"showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Here’s how to get started:"}]},{"type":"orderedList","attrs":{"start":1},"content":[{"type":"listItem","attrs":{"color":null},"content":[{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Complete your profile"},{"type":"text","text":" – Personalize your experience."}]}]},{"type":"listItem","attrs":{"color":null},"content":[{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Explore the features"},{"type":"text","text":" – Check out what’s possible."}]}]},{"type":"listItem","attrs":{"color":null},"content":[{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"Join the community"},{"type":"text","text":" – Connect and collaborate."}]}]}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"button","attrs":{"text":"Get Started Now","isTextVariable":false,"url":"","isUrlVariable":false,"alignment":"center","variant":"filled","borderRadius":"smooth","buttonColor":"#000000","textColor":"#ffffff","showIfKey":null,"paddingTop":10,"paddingRight":32,"paddingBottom":10,"paddingLeft":32}},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"center","showIfKey":null},"content":[{"type":"text","text":"Need help? Our support team is ready to assist! Feel free to reach out anytime."}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"paragraph","attrs":{"textAlign":"left","showIfKey":null},"content":[{"type":"text","text":"Welcome aboard! 🎊"},{"type":"hardBreak"},{"type":"text","text":"The "},{"type":"variable","attrs":{"id":"payload.app_name","label":null,"fallback":null,"required":true}},{"type":"text","text":" Team"}]},{"type":"spacer","attrs":{"height":"lg","showIfKey":null}},{"type":"image","attrs":{"src":"https://github.com/novuhq/blog/blob/main/media-assets/yelp-footer.png?raw=true","alt":null,"title":null,"width":654,"height":65.19938650306749,"alignment":"center","externalLink":null,"isExternalLinkVariable":false,"isSrcVariable":false,"showIfKey":null}},{"type":"footer","attrs":{"textAlign":"center","maily-component":"footer"},"content":[{"type":"text","text":"© 2024 | Acme Inc., 350 Mission Street, San Francisco, CA 94105, U.S.A. | "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://www.yelp.com","target":"_blank","rel":"noopener noreferrer nofollow","class":"mly-no-underline","isUrlVariable":false}}],"text":"www.acme.com"}]}]}',
          subject: 'Welcome to Acme – Let’s Get Started!',
        },
      },
    ],
    tags: [''],
    active: true,
    __source: WorkflowCreationSourceEnum.TEMPLATE_STORE,
  },
};
