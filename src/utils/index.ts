import { format, differenceInDays } from 'date-fns';
import type { ProjectDietConfig, DietPhase } from '@/types';

export function formatDate(date: string | Date, pattern: string = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, pattern);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm');
}

export function getDaysAfterSurgery(surgeryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const surgery = new Date(surgeryDate);
  surgery.setHours(0, 0, 0, 0);
  return differenceInDays(today, surgery);
}

export function getFollowUpDayGroup(dayNumber: number): number | null {
  if (dayNumber === 1) return 1;
  if (dayNumber === 3) return 3;
  if (dayNumber === 7) return 7;
  return null;
}

export const projectDietConfigs: ProjectDietConfig[] = [
  {
    projectType: '双眼皮手术',
    periodDays: 7,
    phases: [
      {
        dayRange: '术后当天',
        title: '肿胀期',
        forbidden: ['辛辣刺激食物', '海鲜', '牛羊肉', '酒精', '过热食物'],
        recommended: ['冷敷', '清淡饮食', '多吃蔬菜水果', '保证充足睡眠']
      },
      {
        dayRange: '第1-3天',
        title: '消肿期',
        forbidden: ['辛辣刺激', '海鲜', '烟酒', '酱油等深色食物'],
        recommended: ['高蛋白食物', '维生素C', '适量活动', '保持伤口清洁']
      },
      {
        dayRange: '第4-7天',
        title: '恢复期',
        forbidden: ['辛辣食物', '酒精', '剧烈运动'],
        recommended: ['正常饮食', '热敷促进消肿', '逐渐恢复正常活动']
      }
    ]
  },
  {
    projectType: '隆鼻手术',
    periodDays: 14,
    phases: [
      {
        dayRange: '术后当天',
        title: '肿胀期',
        forbidden: ['辛辣刺激', '海鲜', '牛羊肉', '酒精', '戴眼镜'],
        recommended: ['冷敷', '抬高头部睡觉', '清淡饮食']
      },
      {
        dayRange: '第1-3天',
        title: '消肿期',
        forbidden: ['辛辣刺激', '海鲜', '烟酒', '擤鼻涕', '剧烈运动'],
        recommended: ['高蛋白饮食', '维生素', '保持鼻腔清洁']
      },
      {
        dayRange: '第4-7天',
        title: '恢复期',
        forbidden: ['辛辣食物', '酒精', '鼻部碰撞'],
        recommended: ['热敷', '正常饮食', '轻度活动']
      },
      {
        dayRange: '第8-14天',
        title: '稳定期',
        forbidden: ['剧烈运动', '鼻部受力'],
        recommended: ['正常生活', '注意保护鼻部']
      }
    ]
  },
  {
    projectType: '颌面手术',
    periodDays: 30,
    phases: [
      {
        dayRange: '术后当天',
        title: '围手术期',
        forbidden: ['进食（术后6小时内）', '漱口', '热敷'],
        recommended: ['冷敷', '静脉营养', '保持头部抬高']
      },
      {
        dayRange: '第1-3天',
        title: '流食期',
        forbidden: ['固体食物', '辛辣刺激', '烟酒', '吸吮动作'],
        recommended: ['牛奶', '豆浆', '粥类', '果汁', '饭后漱口']
      },
      {
        dayRange: '第4-7天',
        title: '半流食期',
        forbidden: ['坚硬食物', '辛辣刺激', '酒精'],
        recommended: ['鸡蛋羹', '软面条', '果泥', '保持口腔卫生']
      },
      {
        dayRange: '第2-4周',
        title: '恢复期',
        forbidden: ['坚硬食物', '大张口', '辛辣刺激'],
        recommended: ['软食为主', '逐渐恢复正常饮食', '张口训练']
      }
    ]
  },
  {
    projectType: '吸脂手术',
    periodDays: 14,
    phases: [
      {
        dayRange: '术后当天',
        title: '急性期',
        forbidden: ['辛辣刺激', '海鲜', '酒精', '剧烈运动'],
        recommended: ['穿塑身衣', '抬高患肢', '清淡饮食']
      },
      {
        dayRange: '第1-7天',
        title: '消肿期',
        forbidden: ['辛辣刺激', '海鲜', '烟酒', '高热量食物'],
        recommended: ['高蛋白饮食', '蔬菜水果', '轻度活动', '持续穿塑身衣']
      },
      {
        dayRange: '第8-14天',
        title: '恢复期',
        forbidden: ['暴饮暴食', '剧烈运动'],
        recommended: ['均衡饮食', '适度运动', '继续穿塑身衣']
      }
    ]
  },
  {
    projectType: '玻尿酸填充',
    periodDays: 3,
    phases: [
      {
        dayRange: '术后当天',
        title: '急性期',
        forbidden: ['辛辣刺激', '酒精', '热敷', '按摩填充部位'],
        recommended: ['冷敷', '清淡饮食', '避免剧烈运动']
      },
      {
        dayRange: '第1-3天',
        title: '稳定期',
        forbidden: ['辛辣刺激', '酒精', '桑拿', '面部按摩'],
        recommended: ['正常饮食', '注意保护填充部位']
      }
    ]
  },
  {
    projectType: '肉毒素注射',
    periodDays: 3,
    phases: [
      {
        dayRange: '术后当天',
        title: '急性期',
        forbidden: ['酒精', '热敷', '按摩注射部位', '剧烈运动'],
        recommended: ['清淡饮食', '保持直立位4小时']
      },
      {
        dayRange: '第1-3天',
        title: '起效期',
        forbidden: ['酒精', '桑拿', '面部按摩'],
        recommended: ['正常饮食', '避免剧烈运动']
      }
    ]
  }
];

export function getDietConfig(projectType: string): ProjectDietConfig | undefined {
  return projectDietConfigs.find(p => p.projectType === projectType);
}

export function getCurrentPhase(surgeryDate: string, projectType: string): DietPhase | null {
  const config = getDietConfig(projectType);
  if (!config) return null;
  
  const dayNumber = getDaysAfterSurgery(surgeryDate);
  if (dayNumber < 0) return config.phases[0];
  
  let accumulatedDays = 0;
  for (const phase of config.phases) {
    const match = phase.dayRange.match(/第(\d+)-(\d+)天/);
    if (match) {
      const start = parseInt(match[1]);
      const end = parseInt(match[2]);
      if (dayNumber >= start && dayNumber <= end) {
        return phase;
      }
      accumulatedDays = end;
    } else if (phase.dayRange === '术后当天') {
      if (dayNumber === 0) return phase;
    }
  }
  
  return config.phases[config.phases.length - 1];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
