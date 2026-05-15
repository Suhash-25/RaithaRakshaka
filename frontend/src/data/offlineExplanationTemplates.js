const DEFAULT_DIAGRAM = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 520 180'><rect width='520' height='180' rx='18' fill='#0f172a'/><g fill='none' stroke='#2dd4bf' stroke-width='4'><path d='M75 90h120'/><path d='M195 90l-18-14m18 14l-18 14'/><path d='M245 90h120'/><path d='M365 90l-18-14m18 14l-18 14'/></g><g fill='#e2e8f0' font-family='Inter,Arial' font-size='18' text-anchor='middle'><text x='80' y='96'>Idea</text><text x='260' y='96'>Reason</text><text x='430' y='96'>Answer</text></g></svg>"

export const EXPLANATION_TEMPLATES = {
  'Concept misunderstanding': {
    type: 'hybrid',
    contentLead: 'Start with the central idea before trying to state the final answer.',
    storyLead: 'Think of it like learning a route: if the starting point is wrong, every turn after that feels confusing.',
    diagram: DEFAULT_DIAGRAM,
  },
  'Partial understanding': {
    type: 'hybrid',
    contentLead: 'You already have part of the idea; the next step is adding the missing link that completes the reasoning.',
    storyLead: 'It is like building a bridge that already has one side finished and only needs the middle section to connect.',
    diagram: DEFAULT_DIAGRAM,
  },
  'Wrong logic application': {
    type: 'visual',
    contentLead: 'Choose the condition that matters first, then apply the rule or method that matches that condition.',
    storyLead: 'It is like picking the right tool before tightening a bolt. A good tool used at the wrong moment still causes trouble.',
    diagram: DEFAULT_DIAGRAM,
  },
  'Rote memorization': {
    type: 'story',
    contentLead: 'Move one step beyond the memorized line and explain why the idea works in this situation.',
    storyLead: 'A remembered label is helpful, but understanding is what lets you use it when the question changes shape.',
    diagram: DEFAULT_DIAGRAM,
  },
  'Language misunderstanding': {
    type: 'hybrid',
    contentLead: 'Slow down and restate what the question is actually asking before solving or explaining.',
    storyLead: 'It helps to treat the question like directions: if one word is misread, you can arrive at the wrong place even while moving confidently.',
    diagram: DEFAULT_DIAGRAM,
  },
}

export function getExplanationTemplate(misconceptionType) {
  return EXPLANATION_TEMPLATES[misconceptionType] ?? EXPLANATION_TEMPLATES['Concept misunderstanding']
}
