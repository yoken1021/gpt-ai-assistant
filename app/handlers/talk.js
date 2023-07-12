import config from '../../config/index.js';
import { t } from '../../locales/index.js';
import { ROLE_AI, ROLE_HUMAN } from '../../services/openai.js';
import { generateCompletion } from '../../utils/index.js';
import { COMMAND_BOT_CONTINUE, COMMAND_BOT_TALK } from '../commands/index.js';
import Context from '../context.js';
import { updateHistory, getHistory } from '../history/index.js';
import { getPrompt, setPrompt } from '../prompt/index.js';

/**
 * @param {Context} context
 * @returns {boolean}
 */
const check = (context) => (
  context.hasCommand(COMMAND_BOT_TALK)
  || context.hasBotName
  || context.source.bot.isActivated
);

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
const exec = (context) => check(context) && (
  async () => {
    console.log('----context start----');
    console.log(context);
    console.log('----context end----');
    console.log('----HistoryArrayLength----');
    const history = getHistory(context.id);
    console.log(history);
    console.log('----HistoryArrayLength----');

    const prompt = getPrompt(context.userId);
    //// prompt.write(ROLE_HUMAN, `${t('__COMPLETION_DEFAULT_AI_TONE')(config.BOT_TONE)}${context.trimmedText}'`).write(ROLE_AI);
    
    // let sensitive_words = config.SENSITIVE_WORDS.split(',');
    // let sensitive_words2 = config.SENSITIVE_WORDS2.split(',');
    // let sensitive_bool = false;
    // for (let i = 0 ; i < sensitive_words.length ; i++){
    //   if (context.event.text?.includes(sensitive_words[i]) || context.transcription?.includes(sensitive_words[i])){
    //     sensitive_bool = true;
    //   }
    // }
    // for (let i = 0 ; i < sensitive_words2.length ; i++){
    //   if (context.event.text?.includes(sensitive_words2[i]) || context.transcription?.includes(sensitive_words2[i])){
    //     sensitive_bool = true;
    //   }
    // }

    // if (sensitive_bool){
    //   prompt.write(ROLE_HUMAN, `${t('__COMPLETION_DEFAULT_AI_TONE_SHY')}${context.sensitiveWords}'`).write(ROLE_AI);
    // }
    // else{
    //   prompt.write(ROLE_HUMAN, `${t('__COMPLETION_DEFAULT_AI_TONE')(config.BOT_TONE)}${context.sensitiveWords}'`).write(ROLE_AI);
    // }

    let time_words = ['日曆','時鐘','日期','時間','幾月','幾日','幾號','幾點','幾分'];
    let time_bool = false;
    for (let i = 0 ; i < time_words.length ; i++){
      if (context.event.text?.includes(time_words[i]) || context.transcription?.includes(time_words[i])){
        time_bool = true;
      }
    }
    let timeStamp = context.source.createdAt;
    let thisTime = new Date(timeStamp*1000);
    let messageTime = thisTime.getFullYear() + "年" + (thisTime.getMonth()+1) + "月" + thisTime.getDate() + "日" + thisTime.getHours() + "時" + thisTime.getMinutes() + "分" + thisTime.getSeconds() + "秒";
    console.log(messageTime);

    if (history.messages.length<=1){
      prompt.write(ROLE_HUMAN, `我是${context.source.name}，${context.trimmedText}`).write(ROLE_AI);
    }
    else if (time_bool){
      prompt.write(ROLE_HUMAN, `(資訊提供:現在時間是${messageTime})。${context.trimmedText}`).write(ROLE_AI);
    }
    else{
      prompt.write(ROLE_HUMAN, `${context.trimmedText}`).write(ROLE_AI);
    }
    
    try {
      const { text, isFinishReasonStop } = await generateCompletion({ prompt });
      prompt.patch(text);
      setPrompt(context.userId, prompt);
      updateHistory(context.id, (history) => history.write(config.BOT_NAME, text));
      const actions = isFinishReasonStop ? [] : [COMMAND_BOT_CONTINUE];
      context.pushText(text, actions);
    } catch (err) {
      context.pushError(err);
    }
    return context;
  }
)();

export default exec;
