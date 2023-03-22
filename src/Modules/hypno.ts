import { BaseModule } from 'base';
import { ModuleCategory } from 'Settings/setting_definitions';
import { settingsSave, parseMsgWords, OnChat, OnAction, OnActivity, SendAction, getRandomInt, hookFunction, removeAllHooksByModule } from '../utils';

export class HypnoModule extends BaseModule {
    load(): void {
        CommandCombine([
            {
                Tag: 'zonk',
                Description: ": zonk self",
        
                Action: () => {
                    if (!triggerActivated)
                        this.StartTriggerWord();
                }
            },
            {
                Tag: 'unzonk',
                Description: ": unzonk self",
        
                Action: () => {
                    if (triggerActivated)
                        this.TriggerRestoreTimeout();
                }
            }
        ]);
        
        OnChat(1000, ModuleCategory.Hypno, (data, sender, msg, metadata) => {
            var lowerMsgWords = parseMsgWords(msg);
            if (!hypnoActivated() && 
                !!Player.ClubGames.Hypno.trigger && 
                (lowerMsgWords?.indexOf(Player.ClubGames.Hypno.trigger) ?? -1) >= 0 && 
                sender.MemberNumber != Player.MemberNumber)
                this.StartTriggerWord();
        });
        
        OnAction(1000, ModuleCategory.Hypno, (data, sender, msg, metadata) => {
            var lowerMsgWords = parseMsgWords(msg);
            if ((lowerMsgWords?.indexOf("snaps") ?? -1) >= 0 && 
                sender.MemberNumber != Player.MemberNumber &&
                hypnoActivated()) {
                this.TriggerRestoreSnap();
            }
        });
        
        OnActivity(1000, ModuleCategory.Hypno, (data, sender, msg, metadata) => {
            let target = data.Dictionary.find((d: any) => d.Tag == "TargetCharacter");
            if (!!target && target.MemberNumber == Player.MemberNumber) {
                if (data.Content == "ChatOther-ItemNose-Pet" && triggerActivated)
                    this.TriggerRestoreBoop();
            }
        });

        hookFunction("Player.HasTints", 4, (args, next) => {
            if (triggerActivated) return true;
            return next(args);
        }, ModuleCategory.Hypno);
        
        hookFunction("Player.GetTints", 4, (args, next) => {
            if (triggerActivated) return [{r: 148, g: 0, b: 211, a: 0.4}];
            return next(args);
        }, ModuleCategory.Hypno);
            
        hookFunction("Player.GetBlurLevel", 4, (args, next) => {
            if (triggerActivated) return 3;
            return next(args);
        }, ModuleCategory.Hypno);

        hookFunction('ServerSend', 5, (args, next) => {
            // Prevent speech at choke level 4
            if (triggerActivated) {
                var type = args[0];
                if (type == "ChatRoomChat" && args[1].Type == "Chat"){
                    SendAction(this.hypnoBlockStrings[getRandomInt(this.hypnoBlockStrings.length)]);
                    return null;
                }
                return next(args);
            }
            return next(args);
        }, ModuleCategory.Hypno);

        // Set Trigger
        let wordLength: number = commonWords.length;
        if (!Player.ClubGames.Hypno.trigger) {
            Player.ClubGames.Hypno.trigger = commonWords[getRandomInt(wordLength)];
            settingsSave();
        }
        if (!Player.ClubGames.Hypno.activatedAt) {
            Player.ClubGames.Hypno.activatedAt = 0;
            settingsSave();
        }
        if (!!Player.ClubGames.Hypno.existingEye1Name)
        this.ResetEyes();

        this.lingerInterval = setInterval(this.CheckNewTrigger, 5000);
    }

    unload(): void {
        removeAllHooksByModule(ModuleCategory.Hypno);
    }

    triggerTimeout: number = 0;
    triggerTimer: number = 300000; // 5 min
    lingerInterval: number = 0; // check if need to reroll every 5s
    lingerTimer: number = 1800000; // 30min
    hornyTimeout: number = 0;

    hypnoBlockStrings = [
        "%NAME%'s eyelids flutter as a thought tries to enter her blank mind...",
        "%NAME% sways weakly in her place, drifting peacefully...",
        "%NAME% trembles as something deep and forgotten fails to resurface...",
        "%NAME% moans softly as she drops even deeper into trance...",
        "%NAME% quivers, patiently awaiting something to fill her empty head..."
    ];

    StartTriggerWord() {
        if (triggerActivated)
            return;

        triggerActivated = true;
        if (Player.ClubGames.Hypno.activatedAt == 0)
            Player.ClubGames.Hypno.activatedAt = new Date().getTime();
        AudioPlaySoundEffect("SciFiEffect", 1);
        settingsSave();
        
        SendAction("%NAME%'s eyes immediately unfocus, her posture slumping slightly as she loses control of her body at the utterance of a trigger word.");
        this.SetEyes();
        CharacterSetFacialExpression(Player, "Blush", "Medium");
        CharacterSetFacialExpression(Player, "Eyebrows", "Lowered");
        CharacterSetFacialExpression(Player, "Eyes", "Dazed");
        CharacterSetFacialExpression(Player, "Fluids", "DroolLow");    

        clearTimeout(this.triggerTimeout);
        this.triggerTimeout = setTimeout(this.TriggerRestoreTimeout, this.triggerTimer);

        clearInterval(this.lingerInterval);
        this.lingerInterval = setInterval(this.CheckNewTrigger, 1000);

        clearInterval(this.hornyTimeout);
        this.hornyTimeout = setInterval(this.HypnoHorny, this.triggerTimer / 100);
    }

    SetEyes() {
        Player.ClubGames.Hypno.existingEye1Name = InventoryGet(Player, "Eyes")?.Asset.Name;
        Player.ClubGames.Hypno.existingEye1Color = InventoryGet(Player, "Eyes")?.Color;
        Player.ClubGames.Hypno.existingEye2Name = InventoryGet(Player, "Eyes2")?.Asset.Name;
        Player.ClubGames.Hypno.existingEye2Color = InventoryGet(Player, "Eyes2")?.Color;
        settingsSave();
        this.EnforceEyes();
    }

    EnforceEyes() {
        var eyeAsset1 = AssetGet("Female3DCG", "Eyes", "Eyes9");
        var eyeAsset2 = AssetGet("Female3DCG", "Eyes2", "Eyes9");

        var eyes1 = InventoryGet(Player, "Eyes");
        var eyes2 = InventoryGet(Player, "Eyes2");

        if (!!eyes1) {
            eyes1.Asset = eyeAsset1 ?? <Asset>{};
            eyes1.Color = "#A2A2A2";
        }    
        if (!!eyes2) {
            eyes2.Asset = eyeAsset2  ?? <Asset>{};
            eyes2.Color = "#A2A2A2";
        }

        ChatRoomCharacterUpdate(Player);
    }

    ResetEyes() {
        var eyeAsset1 = AssetGet("Female3DCG", "Eyes", Player.ClubGames.Hypno.existingEye1Name ?? "Eyes5");
        var eyeAsset2 = AssetGet("Female3DCG", "Eyes2", Player.ClubGames.Hypno.existingEye2Name ?? "Eyes5");

        var eyes1 = InventoryGet(Player, "Eyes");
        var eyes2 = InventoryGet(Player, "Eyes2");

        if (!!eyes1) {
            eyes1.Asset = eyeAsset1 ?? <Asset>{};
            eyes1.Color = Player.ClubGames.Hypno.existingEye1Color;
        }    
        if (!!eyes2) {
            eyes2.Asset = eyeAsset2  ?? <Asset>{};
            eyes2.Color = Player.ClubGames.Hypno.existingEye2Color;
        }

        ChatRoomCharacterUpdate(Player);

        Player.ClubGames.Hypno.existingEye1Name = undefined;
        Player.ClubGames.Hypno.existingEye1Color = undefined;
        Player.ClubGames.Hypno.existingEye2Name = undefined;
        Player.ClubGames.Hypno.existingEye2Color = undefined;
        settingsSave();
    }

    TriggerRestoreBoop() {
        SendAction("%NAME% reboots, blinking and gasping as she regains her senses.");
        this.TriggerRestore();
    }

    TriggerRestoreSnap() {
        SendAction("%NAME% blinks, shaking her head with confusion as she regains her senses.");
        this.TriggerRestore();
    }

    TriggerRestoreTimeout() {
        SendAction("%NAME% gasps, blinking with confusion and blushing.");
        this.TriggerRestore();
    }

    TriggerRestore() {
        this.ResetEyes();
        AudioPlaySoundEffect("SpankSkin");
        CharacterSetFacialExpression(Player, "Eyes", "None");
        clearInterval(this.hornyTimeout);
        clearTimeout(this.triggerTimeout);
        triggerActivated = false;
    }

    HypnoHorny() {
        if (triggerActivated) {
            // enforce eye expression
            this.EnforceEyes();
            CharacterSetFacialExpression(Player, "Eyebrows", "Lowered");
            CharacterSetFacialExpression(Player, "Eyes", "Dazed");

            var progress = Math.min(99, Player.ArousalSettings?.Progress ?? 0 + 5);
            ActivitySetArousal(Player, progress);
        }
    }

    CheckNewTrigger() {
        if (triggerActivated)
            return;
        if (Player.ClubGames.Hypno.activatedAt > 0 && new Date().getTime() - Player.ClubGames.Hypno.activatedAt > this.lingerTimer)
            this.RollTriggerWord();
    }

    RollTriggerWord() {

        SendAction("%NAME% concentrates, breaking the hold the previous trigger word held over her.");
        Player.ClubGames.Hypno.trigger = commonWords[getRandomInt(commonWords.length)];
        Player.ClubGames.Hypno.activatedAt = 0;
        settingsSave();
    }
}

// Trigger Words
const commonWords = [ "able", "about", "absolute", "accept", "account", "achieve", "across", "act", "active", "actual", "add", "address", "admit", "advertise", "affect", "afford", "after", "afternoon", "again", "against", "age", "agent", "ago", "agree", "air", "all", "allow", "almost", "along", "already", "alright", "although", "always", "america", "amount", "another", "answer", "apart", "apparent", "appear", "apply", "appoint", "approach", "appropriate", "area", "argue", "arm", "around", "arrange", "art", "ask", "associate", "assume", "attend", "authority", "available", "aware", "away", "awful", "baby", "back", "bad", "bag", "balance", "ball", "bank", "bar", "base", "basis", "bear", "beat", "beauty", "because", "become", "bed", "before", "begin", "behind", "believe", "benefit", "best", "bet", "between", "big", "bill", "birth", "bit", "black", "bloke", "blood", "blow", "blue", "board", "boat", "body", "book", "both", "bother", "bottle", "bottom", "box", "boy", "break", "brief", "brilliant", "bring", "britain", "brother", "budget", "build", "bus", "business", "busy", "buy", "cake", "call", "car", "card", "care", "carry", "case", "cat", "catch", "cause", "cent", "centre", "certain", "chair", "chairman", "chance", "change", "chap", "character", "charge", "cheap", "check", "child", "choice", "choose", "church", "city", "claim", "class", "clean", "clear", "client", "clock", "close", "closes", "clothe", "club", "coffee", "cold", "colleague", "collect", "college", "colour", "come", "comment", "commit", "committee", "common", "community", "company", "compare", "complete", "compute", "concern", "condition", "confer", "consider", "consult", "contact", "continue", "contract", "control", "converse", "cook", "copy", "corner", "correct", "cost", "could", "council", "count", "country", "county", "couple", "course", "court", "cover", "create", "cross", "cup", "current", "cut", "dad", "danger", "date", "day", "dead", "deal", "dear", "debate", "decide", "decision", "deep", "definite", "degree", "department", "depend", "describe", "design", "detail", "develop", "die", "difference", "difficult", "dinner", "direct", "discuss", "district", "divide", "doctor", "document", "dog", "door", "double", "doubt", "down", "draw", "dress", "drink", "drive", "drop", "dry", "due", "during", "each", "early", "east", "easy", "eat", "economy", "educate", "effect", "egg", "eight", "either", "elect", "electric", "eleven", "else", "employ", "encourage", "end", "engine", "english", "enjoy", "enough", "enter", "environment", "equal", "especial", "europe", "even", "evening", "ever", "every", "evidence", "exact", "example", "except", "excuse", "exercise", "exist", "expect", "expense", "experience", "explain", "express", "extra", "eye", "face", "fact", "fair", "fall", "family", "far", "farm", "fast", "father", "favour", "feed", "feel", "few", "field", "fight", "figure", "file", "fill", "film", "final", "finance", "find", "fine", "finish", "fire", "first", "fish", "fit", "five", "flat", "floor", "fly", "follow", "food", "foot", "force", "forget", "form", "fortune", "forward", "four", "france", "free", "friday", "friend", "from", "front", "full", "fun", "function", "fund", "further", "future", "game", "garden", "gas", "general", "germany", "girl", "give", "glass", "good", "goodbye", "govern", "grand", "grant", "great", "green", "ground", "group", "grow", "guess", "guy", "hair", "half", "hall", "hand", "hang", "happen", "happy", "hard", "hate", "have", "head", "health", "hear", "heart", "heat", "heavy", "hell", "help", "here", "high", "history", "hit", "hold", "holiday", "home", "honest", "hope", "horse", "hospital", "hot", "hour", "house", "however", "hullo", "hundred", "husband", "idea", "identify", "imagine", "important", "improve", "include", "income", "increase", "indeed", "individual", "industry", "inform", "inside", "instead", "insure", "interest", "into", "introduce", "invest", "involve", "issue", "item", "job", "join", "judge", "jump", "just", "keep", "key", "kid", "kill", "kind", "king", "kitchen", "knock", "know", "labour", "lad", "lady", "land", "language", "large", "last", "late", "laugh", "law", "lay", "lead", "learn", "leave", "left", "leg", "less", "letter", "level", "lie", "life", "light", "like", "likely", "limit", "line", "link", "list", "listen", "little", "live", "load", "local", "lock", "london", "long", "look", "lord", "lose", "lot", "love", "low", "luck", "lunch", "machine", "main", "major", "make", "man", "manage", "many", "mark", "market", "marry", "match", "matter", "may", "mean", "meaning", "measure", "meet", "member", "mention", "middle", "might", "mile", "milk", "million", "mind", "minister", "minus", "minute", "miss", "mister", "moment", "monday", "money", "month", "more", "morning", "most", "mother", "motion", "move", "much", "music", "must", "name", "nation", "nature", "near", "necessary", "need", "never", "news", "next", "nice", "night", "nine", "none", "normal", "north", "not", "note", "notice", "number", "obvious", "occasion", "odd", "off", "offer", "office", "often", "okay", "old", "on", "once", "one", "only", "open", "operate", "opportunity", "oppose", "order", "organize", "original", "other", "otherwise", "ought", "out", "over", "own", "pack", "page", "paint", "pair", "paper", "paragraph", "pardon", "parent", "park", "part", "particular", "party", "pass", "past", "pay", "pence", "pension", "people", "percent", "perfect", "perhaps", "period", "person", "photograph", "pick", "picture", "piece", "place", "plan", "play", "please", "plus", "point", "police", "policy", "politic", "poor", "position", "positive", "possible", "post", "pound", "power", "practise", "prepare", "present", "press", "pressure", "presume", "pretty", "previous", "price", "print", "private", "probable", "problem", "proceed", "process", "produce", "product", "programme", "project", "proper", "propose", "protect", "provide", "public", "pull", "purpose", "push", "quality", "quarter", "question", "quick", "quid", "quiet", "quite", "radio", "rail", "raise", "range", "rate", "rather", "read", "ready", "real", "realise", "really", "reason", "receive", "recent", "reckon", "recognize", "recommend", "record", "red", "reduce", "refer", "regard", "region", "relation", "remember", "report", "represent", "require", "research", "resource", "respect", "responsible", "rest", "result", "return", "right", "ring", "rise", "road", "role", "roll", "room", "round", "rule", "run", "safe", "sale", "same", "saturday", "save", "say", "scheme", "school", "science", "score", "scotland", "seat", "second", "secretary", "section", "secure", "see", "seem", "self", "sell", "send", "sense", "separate", "serious", "serve", "service", "set", "settle", "seven", "sex", "shall", "share", "she", "sheet", "shoe", "shoot", "shop", "short", "should", "show", "shut", "sick", "side", "sign", "similar", "simple", "since", "sing", "single", "sir", "sister", "sit", "site", "situate", "six", "size", "sleep", "slight", "slow", "small", "smoke", "social", "society", "some", "son", "soon", "sorry", "sort", "sound", "south", "space", "speak", "special", "specific", "speed", "spell", "spend", "square", "staff", "stage", "stairs", "stand", "standard", "start", "state", "station", "stay", "step", "stick", "still", "stop", "story", "straight", "strategy", "street", "strike", "strong", "structure", "student", "study", "stuff", "stupid", "subject", "succeed", "such", "sudden", "suggest", "suit", "summer", "sun", "sunday", "supply", "support", "suppose", "sure", "surprise", "switch", "system", "table", "take", "talk", "tape", "tax", "tea", "teach", "team", "telephone", "television", "tell", "ten", "tend", "term", "terrible", "test", "than", "thank", "the", "then", "there", "therefore", "they", "thing", "think", "thirteen", "thirty", "this", "thou", "though", "thousand", "three", "through", "throw", "thursday", "tie", "time", "today", "together", "tomorrow", "tonight", "too", "top", "total", "touch", "toward", "town", "trade", "traffic", "train", "transport", "travel", "treat", "tree", "trouble", "true", "trust", "try", "tuesday", "turn", "twelve", "twenty", "two", "type", "under", "understand", "union", "unit", "unite", "university", "unless", "until", "up", "upon", "use", "usual", "value", "various", "very", "video", "view", "village", "visit", "vote", "wage", "wait", "walk", "wall", "want", "war", "warm", "wash", "waste", "watch", "water", "way", "we", "wear", "wednesday", "week", "weigh", "welcome", "well", "west", "what", "when", "where", "whether", "which", "while", "white", "who", "whole", "why", "wide", "wife", "will", "win", "wind", "window", "wish", "with", "within", "without", "woman", "wonder", "wood", "word", "work", "world", "worry", "worse", "worth", "would", "write", "wrong", "year", "yes", "yesterday", "yet", "you", "young" ];



// ****************** Functions *****************

let triggerActivated = false;
export function hypnoActivated() {
    return triggerActivated;
}