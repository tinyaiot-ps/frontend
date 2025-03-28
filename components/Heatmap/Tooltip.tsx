import { InteractionData } from "./Heatmap";
import * as d3 from "d3";
import {useTranslation} from '@/lib/TranslationContext'

type TooltipProps = {
  interactionData: InteractionData | null;
  width: number;
  height: number;
};

export const Tooltip = ({ interactionData, width, height }: TooltipProps) => {
  const { t } = useTranslation();

  if (!interactionData) {
    return null;
  }

  return (
    <div className={`absolute top-0 left-0 w-[${width}] h-[${height}] pointer-events-none`}>
      <div
        className="tooltip absolute bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 p-2.5 rounded-md pointer-events-none opacity-95"
        style={{
          left: interactionData.xPos - 180,
          top: interactionData.yPos,
        }}
      >
        <span>{t("menu.Date")} {d3.timeFormat('%Y-%m-%d')(new Date(interactionData.xLabel))}</span>
        <br />
        <span>{interactionData.value} {t("menu.bin")} ({Number(interactionData.yLabel) - 25}-{interactionData.yLabel}%)</span>
      </div>
    </div>
  );
};
