const fs = require('fs');
const path = require('path');

const TEMPLATES = [
  (t) => `第一章 初临\n\n${t}的世界在眼前展开。主角站在城门之前，望着远处连绵的山脉，心中既有期待也有不安。这是他第一次离开家乡，踏上这条充满未知的道路。\n\n风从山谷中吹来，带着泥土和青草的气息。他知道，从这一刻起，一切都将不同。城门的守卫用审视的目光打量着他，仿佛在衡量这个年轻人是否值得进入这座古老的城市。\n\n"报上名来。"守卫的声音低沉而威严。\n\n主角挺直了脊背，目光坚定。他已经准备好了，无论前方等待着什么，他都不会退缩。`,
  (t) => `第二章 契机\n\n三日后，主角终于找到了${t}传说中的那座古塔。塔身斑驳，布满了岁月的痕迹，但依然能看出昔日的辉煌。\n\n塔门半掩，里面透出幽幽的光芒。主角深吸一口气，推门而入。映入眼帘的是一条螺旋向上的石阶，每一级台阶上都刻着密密麻麻的符文。\n\n"这些符文……"主角蹲下身仔细辨认，"是上古时代的文字。"\n\n一阵微风从塔顶吹下，带着一股莫名的力量。主角感到体内的真气开始躁动，仿佛在回应着什么。他知道，这座塔里一定藏着改变他命运的秘密。`,
  (t) => `第三章 磨砺\n\n修炼的日子枯燥而漫长。在${t}的指导下，主角每天天不亮就开始打坐吐纳，直到月上中天才停下。\n\n起初，他连最基本的引气入体都做不到。但主角并不气馁，他相信勤能补拙。一个月后，他终于感受到了天地间游离的灵气，那些细微的光点如同萤火虫一般在他的周围飞舞。\n\n"不错，你比我预想的要快。"长老捋着胡须，满意地点了点头。\n\n主角睁开眼睛，眼中闪过一丝精光。他知道，这只是开始，前方的路还很长。`,
  (t) => `第四章 初战\n\n消息传来的时候，主角正在闭关。${t}的山谷遭到不明势力的袭击，数十名弟子受伤，三座修炼室被毁。\n\n主角猛地睁开双眼，真气在体内翻涌。他站起身，大步走出洞府。山谷中硝烟弥漫，到处都是断壁残垣。\n\n"是谁干的？"主角的声音冰冷。\n\n"是……是黑风寨的人。"一名受伤的弟子艰难地说道，"他们说……要我们交出传承……"\n\n主角握紧了拳头，指节发白。他知道，忍让只会换来更多的欺压。`,
  (t) => `第五章 锋芒\n\n决战来得比预想的要早。黑风寨的寨主亲自带队，黑压压的人群将${t}的山门围得水泄不通。\n\n主角站在山门前，身后是仅存的数十名弟子。对面是数百名黑衣武者，为首的是一个满脸横肉的壮汉，手中提着一把巨大的战斧。\n\n"小子，识相的话就交出传承，否则今天就是你们的末日！"寨主狂笑道。\n\n主角没有说话，只是缓缓拔出了腰间的长剑。剑身在阳光下泛着寒光，一股凛冽的杀意弥漫开来。\n\n"既然来了，就不用走了。"\n\n话音未落，主角已经冲了出去。`,
  (t) => `第六章 暗流\n\n胜利的喜悦并没有持续太久。就在${t}以为一切都在好转的时候，一封密信打破了平静。\n\n信上只有一句话："你的身世，并不像你想象的那么简单。"\n\n主角握着信纸的手微微颤抖。他一直以为自己只是一个普通人家的孩子，但最近发生的种种事情让他开始怀疑。\n\n为什么他的体内会有那股神秘的力量？为什么那些强者会对他另眼相看？\n\n"也许，是时候去寻找真相了。"主角望着远方，喃喃自语。`,
  (t) => `第七章 远行\n\n告别了${t}，主角踏上了寻亲之路。根据密信中的线索，他的身世与北方的雪域有着千丝万缕的联系。\n\n一路上，主角见识了太多从未见过的景象。繁华的都城、荒凉的戈壁、连绵的雪山……每一处都给他带来新的震撼。\n\n在一座边陲小镇，主角遇到了一个神秘的老人。老人似乎知道很多关于他的事情，但却不肯多说。\n\n"当你足够强大的时候，一切都会水落石出。"老人留下这句话便消失在了风雪中。`,
  (t) => `第八章 雪域\n\n翻过最后一座雪山，眼前豁然开朗。${t}的雪域并非想象中的荒凉，反而有着一片生机勃勃的绿洲。\n\n这里的人们穿着洁白的长袍，面容祥和。他们看到主角时，眼中闪过一丝惊讶，然后便是恭敬。\n\n"您终于回来了。"一位老者走上前来，声音颤抖。\n\n主角愣住了。"您认识我？"\n\n老者点了点头，浑浊的眼中泛起泪光。"请跟我来，有些事情……是时候让您知道了。"\n\n主角跟着老者穿过绿洲，来到一座宏伟的宫殿前。`,
  (t) => `第九章 真相\n\n大殿之中，数十位长老端坐两侧。主角站在中央，听着${t}讲述那个尘封已久的故事。\n\n"十八年前，雪域遭遇了一场浩劫。为了保护年幼的王子，我们将他送到了南方，交给了一个普通人家抚养。"\n\n主角的呼吸变得急促。"所以……那个王子就是我？"\n\n老者缓缓点头。"您的父亲是雪域之王，母亲是南疆圣女。您身上流淌着两族最高贵的血脉。"\n\n主角闭上了眼睛，脑海中浮现出无数画面。那些梦境、那些直觉、那些无法解释的力量……一切都有了答案。`,
  (t) => `第十章 归来\n\n消息如同长了翅膀一般传遍了整个${t}。雪域王子归来，这个消息震动了四方。\n\n有人欢喜有人愁。那些曾经参与迫害王子的势力开始坐立不安，他们知道，一旦王子登基，等待他们的将是清算。\n\n主角并没有急于复仇。他知道，真正的强大不是靠杀戮，而是靠智慧和胸怀。\n\n"我要建立一个没有人需要流离失所的世界。"主角站在雪域之巅，俯瞰着脚下的大地，许下了自己的誓言。\n\n风吹过他的衣袍，猎猎作响。身后，万千子民跪伏在地，眼中满是希望。\n\n新的时代，从此刻开始。`
];

function generateChapters(title) {
  return TEMPLATES.map(fn => fn(title));
}

const BOOKS = [
  { id: '001', title: '苍穹之上', author: '辰东', cover: '', spineColor: '#c0392b' },
  { id: '002', title: '剑来', author: '烽火戏诸侯', cover: '', spineColor: '#2980b9' },
  { id: '003', title: '大道朝天', author: '猫腻', cover: '', spineColor: '#27ae60' },
  { id: '004', title: '完美世界', author: '辰东', cover: '', spineColor: '#8e44ad' },
  { id: '005', title: '遮天', author: '辰东', cover: '', spineColor: '#d35400' },
  { id: '006', title: '凡人修仙传', author: '忘语', cover: '', spineColor: '#16a085' },
  { id: '007', title: '斗破苍穹', author: '天蚕土豆', cover: '', spineColor: '#e74c3c' },
  { id: '008', title: '大主宰', author: '天蚕土豆', cover: '', spineColor: '#2c3e50' },
  { id: '009', title: '圣墟', author: '辰东', cover: '', spineColor: '#f39c12' },
  { id: '010', title: '全职高手', author: '蝴蝶蓝', cover: '', spineColor: '#1abc9c' },
  { id: '011', title: '雪中悍刀行', author: '烽火戏诸侯', cover: '', spineColor: '#3498db' },
  { id: '012', title: '牧神记', author: '宅猪', cover: '', spineColor: '#9b59b6' },
  { id: '013', title: '一念永恒', author: '耳根', cover: '', spineColor: '#e67e22' },
  { id: '014', title: '仙逆', author: '耳根', cover: '', spineColor: '#34495e' },
  { id: '015', title: '帝霸', author: '厌笔萧生', cover: '', spineColor: '#c0392b' },
  { id: '016', title: '夜的命名术', author: '会说话的肘子', cover: '', spineColor: '#2ecc71' },
  { id: '017', title: '万族之劫', author: '老鹰吃小鸡', cover: '', spineColor: '#e74c3c' },
  { id: '018', title: '我师兄实在太稳健了', author: '言归正传', cover: '', spineColor: '#f1c40f' },
  { id: '019', title: '诡秘之主', author: '爱潜水的乌贼', cover: '', spineColor: '#8e44ad' },
  { id: '020', title: '大奉打更人', author: '卖报小郎君', cover: '', spineColor: '#2980b9' },
  { id: '021', title: '永生', author: '梦入神机', cover: '', spineColor: '#16a085' },
  { id: '022', title: '伏天氏', author: '净无痕', cover: '', spineColor: '#d35400' },
  { id: '023', title: '独步逍遥', author: '李行远', cover: '', spineColor: '#7f8c8d' },
  { id: '024', title: '万古第一神', author: '风青阳', cover: '', spineColor: '#e74c3c' }
];

const booksWithChapters = BOOKS.map(b => ({
  ...b,
  chapters: generateChapters(b.title)
}));

const interfaceBlock = `export interface Book {
  id: string
  title: string
  author: string
  cover: string
  spineColor: string
  chapters: string[]
}
`;

const dataJson = JSON.stringify(booksWithChapters, null, 2);

const content = interfaceBlock + '\nexport const books: Book[] = ' + dataJson + '\n';

const outPath = path.join(__dirname, 'src', 'data', 'books.ts');
fs.writeFileSync(outPath, content, { encoding: 'utf8' });

console.log('Wrote ' + outPath + ' (' + content.length + ' bytes)');
