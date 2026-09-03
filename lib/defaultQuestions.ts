import { Question } from './types';

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q1',
    order: 1,
    title: '1. Você sabe o que é feito com o dinheiro arrecadado pelos impostos?',
    type: 'radio',
    options: ['Sim', 'Não', 'Sei um pouco'],
    required: true,
  },
  {
    id: 'q2',
    order: 2,
    title: '2. Qual(is) tipo(s) de imposto você conhece?',
    type: 'checkbox',
    options: [
      'IPTU - Imposto Predial e Territorial Urbano',
      'IPVA - Imposto sobre a Propriedade de Veículos Automotores.',
      'ICMS - Imposto sobre Circulação de Mercadorias e Serviços',
      'ISS - Imposto sobre Serviços de Qualquer Natureza',
      'ITBI - Imposto sobre a Transmissão de Bens Imóveis',
      'Não conheço nenhum',
    ],
    required: true,
  },
  {
    id: 'q3',
    order: 3,
    title: '3. Você costuma pedir nota fiscal ao realizar uma compra?',
    type: 'radio',
    options: ['Sempre', 'Às vezes', 'Nunca'],
    required: true,
  },
  {
    id: 'q4',
    order: 4,
    title: '4. Você sabe por que é importante pedir a nota fiscal?',
    type: 'radio',
    options: ['Sim', 'Não', 'Sei um pouco'],
    required: true,
  },
  {
    id: 'q5',
    order: 5,
    title: '5. Na sua opinião, pedir a nota fiscal contribui para a cidadania fiscal?',
    type: 'radio',
    options: ['Sim', 'Não', 'Não sei'],
    required: true,
  },
  {
    id: 'q6',
    order: 6,
    title: '6. Você gostaria de aprender mais sobre impostos e como o dinheiro público é utilizado?',
    type: 'radio',
    options: ['Sim', 'Não'],
    required: true,
  },
];
