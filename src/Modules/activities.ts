import { BaseModule } from "base";
import { BaseSettingsModel } from "Settings/Models/base";
import { ModuleCategory } from "Settings/setting_definitions";
import { OnActivity, SendAction, getRandomInt, removeAllHooksByModule, setOrIgnoreBlush, hookFunction } from "../utils";
import { hypnoActivated } from "./hypno";

export interface ActivityTarget {
    Name: AssetGroupItemName;
    SelfAllowed?: boolean | false;
    SelfOnly?: boolean | false;
    TargetLabel?: string | undefined;
    TargetSelfLabel?: string | undefined;
    TargetAction: string;
    TargetSelfAction?: string | undefined;
}

export interface CustomPrerequisite {
    Name: string;
    Func(acting: Character, acted: Character, group: AssetGroup): boolean;
}

export interface ActivityBundle {
    Activity: Activity;
    Targets: ActivityTarget[];
    CustomPrereqs?: CustomPrerequisite[];
}

export class ActivityModule extends BaseModule {
    load(): void {
        hookFunction("ServerSend", 100, (args, next) => {
            if (args[0] == "ChatRoomChat" && args[1]?.Type == "Activity"){
                console.info("Activity ServerSend");
                let data = args[1];
                let actName = data.Dictionary[3]?.ActivityName ?? "";
                if (actName.indexOf("LSCG_") == 0) {
                    // Intercept custom activity send and just do a custom action instead..
                    let {metadata, substitutions} = ChatRoomMessageRunExtractors(data, Player)
                    let msg = ActivityDictionaryText(data.Content);
                    msg = CommonStringSubstitute(msg, substitutions)
                    data.Dictionary.push({
                        Tag: "MISSING ACTIVITY DESCRIPTION FOR KEYWORD " + data.Content,
                        Text: msg
                    });
                    return next(args);
                }
                else
                    return next(args);
            }
            else {
                return next(args);
            }
        }, ModuleCategory.Activities);

        hookFunction("ActivityCheckPrerequisite", 100, (args, next) => {
            var prereqName = <string>args[0];
            if (this.CustomPrerequisiteFuncs.has(prereqName)) {
                var acting = args[1];
                var acted = args[2];
                var targetGrp = args[3];
                var customPrereqFunc = this.CustomPrerequisiteFuncs.get(prereqName);
                if (!customPrereqFunc)
                    return next(args);
                else {
                    return customPrereqFunc(acting, acted, targetGrp);
                }
            }
            else
                return next(args);
        })

        // Hug
        this.AddActivity({
            Activity: <Activity>{
                Name: "Hug",
                MaxProgress: 70,
                MaxProgressSelf: 70,
                Prerequisite: ["UseArms"]
            },
            Targets: [
                <ActivityTarget>{
                    Name: "ItemArms",
                    SelfAllowed: true,
                    TargetAction: "SourceCharacter wraps PronounPossessive arms around TargetCharacter in a big warm hug.",
                    TargetSelfAction: "SourceCharacter wraps TargetCharacter in a theraputic self-hug."
                }
            ]
        });

        // Tackle
        this.AddActivity({
            Activity: <Activity>{
                Name: "Tackle",
                MaxProgress: 50,
                MaxProgressSelf: 50,
                Prerequisite: ["UseArms"]
            },
            Targets: [
                <ActivityTarget>{
                    Name: "ItemArms",
                    SelfAllowed: false,
                    TargetAction: "SourceCharacter full body tackles TargetCharacter!"
                }
            ]
        });

        // Flop
        this.AddActivity({
            Activity: <Activity>{
                Name: "Flop",
                MaxProgress: 50,
                MaxProgressSelf: 50,
                Prerequisite: ["UseLegs"]
            },
            Targets: [
                <ActivityTarget>{
                    Name: "ItemArms",
                    SelfAllowed: false,
                    TargetAction: "SourceCharacter flops on top of TargetCharacter!"
                }
            ]
        });

        // KissEyes
        this.AddActivity({
            Activity: <Activity>{
                Name: "KissEyes",
                MaxProgress: 75,
                MaxProgressSelf: 50,
                Prerequisite: ["ZoneAccessible"]
            },
            Targets: [
                <ActivityTarget>{
                    Name: "ItemHead",
                    SelfAllowed: false,
                    TargetLabel: "Kiss Eyes",
                    TargetAction: "SourceCharacter gently kisses over TargetCharacter's eyes."
                }
            ]
        });

        // RubPussy
        this.AddActivity({
            Activity: <Activity>{
                Name: "RubPussy",
                MaxProgress: 100,
                MaxProgressSelf: 100,
                Prerequisite: ["ZoneAccessible", "ZoneNaked", "HasVagina"]
            },
            Targets: [
                <ActivityTarget>{
                    Name: "ItemPenis",
                    SelfAllowed: false,
                    TargetLabel: "Rub Pussy",
                    TargetAction: "SourceCharacter grinds their pussy against TargetCharacter's penis."
                }
            ]
        });

        // RubPenis
        this.AddActivity({
            Activity: <Activity> {
                Name: "RubPenis",
                MaxProgress: 100,
                MaxProgressSelf: 100,
                Prerequisite: ["ZoneAccessible", "ZoneNaked", "CanUsePenis", "HasPenis", "Needs-PenetrateItem"]
            },
            Targets: [
                <ActivityTarget>{
                    Name: "ItemHead",
                    TargetLabel: "Rub With Penis",
                    TargetAction: "SourceCharacter rubs PronounPossessive penis along TargetCharacter's face."
                }, <ActivityTarget>{
                    Name: "ItemMouth",
                    TargetLabel: "Slap With Penis",
                    TargetAction: "SourceCharacter slaps PronounPossessive penis against TargetCharacter's mouth."
                }, <ActivityTarget>{
                    Name: "ItemVulva",
                    TargetLabel: "Rub With Penis",
                    TargetAction: "SourceCharacter runs PronounPossessive penis against TargetCharacter's pussy."
                }, <ActivityTarget>{
                    Name: "ItemBreast",
                    TargetLabel: "Rub With Penis",
                    TargetAction: "SourceCharacter rubs PronounPossessive penis in between TargetCharacter's breasts."
                }, <ActivityTarget>{
                    Name: "ItemLegs",
                    TargetLabel: "Rub With Penis",
                    TargetAction: "SourceCharacter rubs PronounPossessive penis against TargetCharacter's thigh."
                }, <ActivityTarget>{
                    Name: "ItemFeet",
                    TargetLabel: "Rub With Penis",
                    TargetAction: "SourceCharacter rubs PronounPossessive penis against TargetCharacter's calf."
                }, <ActivityTarget>{
                    Name: "ItemBoots",
                    TargetLabel: "Rub With Penis",
                    TargetAction: "SourceCharacter rubs PronounPossessive penis against TargetCharacter's feet."
                }, <ActivityTarget>{
                    Name: "ItemButt",
                    TargetLabel: "Rub With Penis",
                    TargetAction: "SourceCharacter rubs PronounPossessive penis in between TargetCharacter's ass cheeks."
                }, <ActivityTarget>{
                    Name: "ItemNeck",
                    TargetLabel: "Slap With Penis",
                    TargetAction: "SourceCharacter slaps PronounPossessive penis down on TargetCharacter's neck."
                }, <ActivityTarget>{
                    Name: "ItemArms",
                    TargetLabel: "Rub With Penis",
                    TargetAction: "SourceCharacter rubs PronounPossessive penis against TargetCharacter's arm."
                }, <ActivityTarget>{
                    Name: "ItemHands",
                    TargetLabel: "Rub With Penis",
                    TargetAction: "SourceCharacter runs PronounPossessive penis in between TargetCharacter's fingers."
                }, <ActivityTarget>{
                    Name: "ItemPenis",
                    TargetLabel: "Rub With Penis",
                    TargetAction: "SourceCharacter runs PronounPossessive penis against TargetCharacter's own penis."
                }
            ]
        });

        // WagTail
        this.AddActivity({
            Activity: {
                Name: "WagTail",
                MaxProgress: 50,
                MaxProgressSelf: 50,
                Prerequisite: [],
                Target: []
            },
            Targets: [{
                Name: "ItemButt",
                SelfAllowed: true,
                SelfOnly: true,
                TargetLabel: "Wag Tail",
                TargetAction: "SourceCharacter wags PronounPossessive tail."
            }],
            CustomPrereqs: [
                {
                    Name: "HasTail",
                    Func: (acting, acted, group) => !!InventoryGet(acted, "TailStraps")
                }
            ]
        });

        // NibbleTail
        this.AddActivity({
            Activity: {
                Name: "Nibble",
                MaxProgress: 90,
                MaxProgressSelf: 50,
                Prerequisite: ["HasTail"],
                Target: []
            },
            Targets: [{
                Name: "ItemButt",
                SelfAllowed: true,
                TargetLabel: "Nibble Tail",
                TargetAction: "SourceCharacter nibbles on TargetCharacter's tail.",
                TargetSelfAction: "SourceCharacter nibbles on PronounPossessive own tail."
            }]
        });

        // FuckWithPussy
        this.AddActivity({
            Activity: <Activity>{
                Name: "FuckWithPussy",
                MaxProgress: 100,
                MaxProgressSelf: 100,
                Prerequisite: ["ZoneAccessible", "ZoneNaked", "HasVagina", "TargetHasPenis"]
            },
            Targets: [
                {
                    Name: "ItemVulva",
                    SelfAllowed: false,
                    TargetLabel: "Grind with Pussy",
                    TargetAction: "SourceCharacter grinds PronounPossessive pussy against TargetCharacter's."
                }, {
                    Name: "ItemPenis",
                    SelfAllowed: false,
                    TargetLabel: "Ride with Pussy",
                    TargetAction: "SourceCharacter fucks TargetCharacter's penis with PronounPossessive pussy, grinding up and down."
                }
            ],
            CustomPrereqs: [
                {
                    Name: "SourceVulvaEmpty",
                    Func: (acting, acted, group) => !acting.IsVulvaFull()
                }
            ]
        });

        // FuckWithAss
        this.AddActivity({
            Activity: <Activity>{
                Name: "FuckWithAss",
                MaxProgress: 100,
                MaxProgressSelf: 100,
                Prerequisite: ["ZoneAccessible", "ZoneNaked", "TargetHasPenis"]
            },
            Targets: [
                {
                    Name: "ItemVulva",
                    SelfAllowed: false,
                    TargetLabel: "Grind with Ass",
                    TargetAction: "SourceCharacter grinds PronounPossessive ass against TargetCharacter's vulva."
                },{
                    Name: "ItemPenis",
                    SelfAllowed: false,
                    TargetLabel: "Ride with Ass",
                    TargetAction: "SourceCharacter fucks TargetCharacter's penis with PronounPossessive ass."
                }
            ],
            CustomPrereqs: [
                {
                    Name: "SourceAssEmpty",
                    Func: (acting, acted, group) => !acting.IsPlugged()
                }
            ]
        });
    }

    unload(): void {
        removeAllHooksByModule(ModuleCategory.Activities);
    }

    CustomPrerequisiteFuncs: Map<string, (acting: Character, acted: Character, group: AssetGroup) => boolean> = new Map<string, (acting: Character, acted: Character, group: AssetGroup) => boolean>();

    AddActivity(bundle: ActivityBundle) {
        if (bundle.Targets.length <= 0)
            return;

        let activity = bundle.Activity;
        activity.Target = activity.Target ?? [];
        activity.Prerequisite = activity.Prerequisite ?? [];
        activity.Name = "LSCG_" + activity.Name;

        bundle.CustomPrereqs?.forEach(prereq => {
            activity.Prerequisite.push(prereq.Name);
            if (!this.CustomPrerequisiteFuncs.get(prereq.Name))
                this.CustomPrerequisiteFuncs.set(prereq.Name, prereq.Func)
        })

        ActivityDictionary.push([
            "Activity"+activity.Name,
            bundle.Targets[0].TargetLabel ?? activity.Name.substring(5)
        ])

        bundle.Targets.forEach(tgt => {
            tgt.TargetLabel = tgt.TargetLabel ?? activity.Name.substring(5);

            if (tgt.SelfAllowed) {
                if (!activity.TargetSelf)
                    activity.TargetSelf = [];
                if ((<AssetGroupItemName[]>activity.TargetSelf).indexOf(tgt.Name) == -1) {
                    (<AssetGroupItemName[]>activity.TargetSelf).push(tgt.Name);
                }
            }

            if (!tgt.SelfOnly) {
                if (!activity.Target)
                    activity.Target = [];

                if (activity.Target.indexOf(tgt.Name) == -1) {
                    activity.Target.push(tgt.Name);
                }            
            }

            ActivityDictionary.push([
                "Label-ChatOther-" + tgt.Name + "-" + activity.Name,
                tgt.TargetLabel
            ]);
            ActivityDictionary.push([
                "ChatOther-" + tgt.Name + "-" + activity.Name,
                tgt.TargetAction
            ]);

            if (tgt.SelfAllowed) {
                ActivityDictionary.push([
                    "Label-ChatSelf-" + tgt.Name + "-" + activity.Name,
                    tgt.TargetSelfLabel ?? tgt.TargetLabel
                ]);
                ActivityDictionary.push([
                    "ChatSelf-" + tgt.Name + "-" + activity.Name,
                    tgt.TargetSelfAction ?? tgt.TargetAction
                ]);
            }
        });

        ActivityFemale3DCG.push(activity);
        ActivityFemale3DCGOrdering.push(activity.Name);
    }
}