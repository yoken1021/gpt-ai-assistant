import config from '../../config/index.js';
import { t } from '../../locales/index.js';
import { ROLE_AI, ROLE_HUMAN } from '../../services/openai.js';
import { generateCompletion } from '../../utils/index.js';
import { COMMAND_BOT_CONTINUE, COMMAND_BOT_TALK } from '../commands/index.js';
import Context from '../context.js';
import { updateHistory } from '../history/index.js';
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
    const prompt = getPrompt(context.userId);
    // prompt.write(ROLE_HUMAN, `${t('__COMPLETION_DEFAULT_AI_TONE')(config.BOT_TONE)}${context.trimmedText}'`).write(ROLE_AI);
    
    let sensitive_words = config.SENSITIVE_WORDS.split(',');
    let sensitive_bool = false;
    for (let i = 0 ; i < sensitive_words.length ; i++){
      console.log('現在要檢查的是:'+sensitive_words[i]);
      console.log(context);
      console.log('你打的文字應該是:');
      console.log(context.event.text);
      if (context.event.text?.ToString?.includes(sensitive_words[i]) || context.transcription?.ToString?.includes(sensitive_words[i])){
        sensitive_bool = true;
        console.log('中啦!!');
      }
    }

    if (sensitive_bool){
      prompt.write(ROLE_HUMAN, `t('__COMPLETION_DEFAULT_AI_TONE_SHY')${context.sensitiveWords}'`).write(ROLE_AI);
    }
    else{
      prompt.write(ROLE_HUMAN, `${t('__COMPLETION_DEFAULT_AI_TONE')(config.BOT_TONE)}${context.sensitiveWords}'`).write(ROLE_AI);
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
