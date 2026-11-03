// 영상 화면의 스페인어 (EN / ES 토글)
// Lottie 영상 속 글자는 도형으로 그려져 있어서 코드로 바꿀 수 없다.
//   - 자막: 영상 속 영어 자막(caption 레이어)을 숨기고 captions의 스페인어 자막을 같은 자리에 띄운다 (마커 번호 기준)
//   - 영상 자체를 바꾸려면 스페인어판 Lottie를 motion에 넣는다 (지금은 없음)
// 그 밖에 코드로 그리는 글자(제목, Recap, AI 답변, 종료 화면 등)는 여기 번역으로 바꾼다.

export const UI = {
  en: {
    finishTitle: 'You finished the lecture.',
    finishSub: 'Two quick questions to lock it in.',
    rewatch: 'Rewatch',
    startQuestions: 'Start questions',
    recapChip: 'Recap',
    noPrediction: 'No prediction',
  },
  es: {
    finishTitle: 'Terminaste la clase.',
    finishSub: 'Dos preguntas rápidas para afianzarlo.',
    rewatch: 'Ver de nuevo',
    startQuestions: 'Empezar preguntas',
    recapChip: 'Repaso',
    noPrediction: 'Sin predicción',
  },
};

// 과목별 스페인어 (TODAY의 subject 기준)
export const ES = {
  Biology: {
    subject: 'Biología',
    title: '¿De dónde viene la masa de un árbol?',
    captions: {
      '01_1': '“Un pequeño árbol joven se convierte en un árbol grande.”',
      '01_2': '“¿De dónde salió toda esa masa extra? Haz una predicción.”',
      '01_3': '“La mayoría cree que del suelo. Vamos a comprobarlo.”',
      '02_1': '“Primero, pesa el suelo seco y el árbol joven.”',
      '02_2': '“Este es el experimento que hizo Jan van Helmont en la década de 1640.”',
      '03_1': '“Ahora deja pasar cinco años.”',
      '03_2': '“No se añade suelo. El árbol solo recibe agua.”',
      '04_1': '“Pesa todo otra vez.”',
      '04_2': '“El árbol ganó 74,4 kilos. El suelo casi no perdió nada.”',
      '04_3': '“Así que la masa no vino del suelo.”',
      '05_1': '“Ahora, sella la planta en una caja y quítale el dióxido de carbono.”',
      '05_2': null, // 영상에서도 숨긴 자막 (05 장면 흐름을 바꿈)
      '06_1': '“Esto es lo que mostró tu laboratorio.”',
      '06_2': '“La luz convierte el dióxido de carbono y el agua en glucosa.”',
      '06_3': '“Y la glucosa forma el cuerpo del árbol. Esos son los 74,4 kilos.”',
    },
    recap: {
      caption: '“Predijiste, experimentaste y los datos mostraron de dónde viene la masa.”',
      prediction: {
        label: 'Mi predicción',
        texts: { 'choice-soil': 'Vino del suelo', 'choice-water': 'Vino del agua', 'choice-air': 'Vino del aire' },
        ruledOut: 'Probado y descartado',
        confirmed: 'Confirmado por los datos',
      },
      cards: [
        { label: 'Mi experimento', html: 'Suelo −0,06 kg<br />Sin CO₂, sin crecimiento' },
        { label: 'Principio', html: 'La fotosíntesis convierte<br />el <mark>CO₂</mark> en árbol' },
      ],
    },
    ask: {
      question: '¿Entonces cómo se convierte el aire en la madera de un árbol?',
      steps: [
        { top: 'CO₂', bottom: 'del aire' },
        { top: 'luz + agua', bottom: 'en la hoja' },
        { top: 'glucosa', bottom: 'un tipo de azúcar' },
      ],
      result: '= madera',
      answer: '“Las hojas toman CO₂ del aire. La luz lo convierte, junto con el agua, en glucosa, y la glucosa forma la madera.”',
    },
  },
  Algebra: {
    subject: 'Álgebra',
    title: 'Resolver ecuaciones lineales',
    captions: {
      '01_1': '“Esta es la idea clave para resolver ecuaciones.”',
      '01_2': '“Lo que hagas en un lado, hazlo también en el otro.”',
      '02_1': '“Imagina una balanza.”',
      '02_2': '“Quita cinco de los dos lados y sigue equilibrada.”',
      '03_1': '“Resolvamos juntos la que hicimos en clase.”',
      '03_2': '“Tres x más cinco es igual a veinte. ¿Qué deshacemos primero?”',
      '04_1': '“Primero, quitamos el más cinco.”',
      '04_2': '“Resta cinco en los dos lados y solo queda tres x.”',
      '05_1': '“Ahora divide los dos lados entre tres.”',
      '05_2': '“Tres x son tres equis. Al dividir entre tres queda una x.”',
    },
  },
  'English 9': {
    subject: 'Inglés 9',
    title: 'Romeo y Julieta',
    captions: {
      '01_1': '“Esta es la pregunta que comentamos en clase.”',
      '01_2': '“¿Por qué Romeo llama sol a Julieta?”',
      '02_1': '“Romeo ve una luz en la ventana de Julieta.”',
      '02_2': '“Luego, en un solo verso, decide qué es.”',
      '03_1': '“No dice que Julieta es como el sol.”',
      '03_2': '“Dice que ella es el sol. Eso es una metáfora.”',
      '04_1': '“Ahora mira la luna.”',
      '04_2': '“Romeo la llama envidiosa, como si tuviera sentimientos.”',
      '04_3': '“Eso se llama personificación.”',
    },
  },
  History: {
    subject: 'Historia',
    title: 'La Revolución Industrial',
    captions: {
      '01_1': '“La Revolución Industrial empezó en Gran Bretaña en la década de 1760.”',
      '01_2': '“Las máquinas y las fábricas cambiaron cómo se hacían las cosas.”',
      '02_1': '“Antes de leer la fuente, aquí hay cuatro palabras difíciles.”',
      '02_2': '“En 1832, Matthew Crabtree le dijo al Parlamento que trabajaba de cinco de la mañana a nueve de la noche.”',
      '02_3': '“Son dieciséis horas de trabajo.”',
      '03_1': '“Esta es nuestra pregunta.”',
      '03_2': '“¿Fue una bendición o la raíz de la desigualdad y la contaminación?”',
      '04_1': '“El primer documental muestra el lado de la bendición.”',
      '04_2': '“La tela se abarató y los trenes movían mercancías y personas rápido.”',
      '05_1': '“El segundo documental muestra el otro lado.”',
      '05_2': '“Los dueños se hicieron ricos, mientras los niños trabajaban 16 horas.”',
      '05_3': '“Y el humo de las fábricas volvió negro el cielo de las ciudades.”',
      '06_1': '“Ahora debate con Mateo, tu compañero de IA.”',
      '06_2': '“Mateo: ¡Equipo bendición! La tela barata significó más ropa para todos.”',
      '06_5': '“Mateo: Es justo. Pero ¿por qué no cambiar las leyes?”',
      '07_1': '“Conoce las pruebas de los dos lados y luego elige el tuyo.”',
      '07_2': '“Elige un lado, apóyalo con pruebas y responde al otro lado.”',
    },
  },
};
