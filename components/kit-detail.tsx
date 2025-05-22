import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
import { type KitType, kitRituals, kitDescriptions } from "@/lib/hydration-engine"

interface KitDetailProps {
  kit: KitType
}

export default function KitDetail({ kit }: KitDetailProps) {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <Badge className="w-fit mb-2">{kit}</Badge>
        <CardTitle className="text-xl">{kit}</CardTitle>
        <CardDescription className="text-gray-700 dark:text-gray-300">{kitDescriptions[kit]}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Ritual Steps</h3>
          <div className="space-y-3">
            {kitRituals[kit].map((step, index) => (
              <div key={index} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-0.5">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Benefits</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Enhances hydration absorption through targeted delivery</li>
            <li>Promotes mental clarity and focus</li>
            <li>Supports recovery and muscle relaxation</li>
            <li>Creates a mindful moment for stress reduction</li>
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">When to Use</h3>
          <p className="text-gray-600 dark:text-gray-300">
            This kit is ideal for{" "}
            {kit === "White Ember" || kit === "Copper Whisper"
              ? "post-workout recovery and cooling down after intense physical activity."
              : kit === "Silver Mirage" || kit === "Cold Halo"
                ? "mental clarity and focus restoration after long periods of screen time or mental work."
                : kit === "Echo Spiral" || kit === "Iron Drift"
                  ? "digestive support and rebalancing after meals or social events."
                  : kit === "Night Signal" || kit === "Black Veil"
                    ? "evening wind-down and preparation for restful sleep."
                    : kit === "Sky Salt" || kit === "Morning Flow"
                      ? "balanced, sustained energy without stimulants throughout the day."
                      : "gentle cleansing and hormonal support during rest days or low-energy periods."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
