import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, Beaker, DollarSign } from "lucide-react";

interface FormulaEditorProps {
  value: string;
  onChange: (value: string, type: "plain" | "latex" | "accounting") => void;
  formulaType?: "plain" | "latex" | "accounting";
}

export const FormulaEditor = ({ value, onChange, formulaType = "plain" }: FormulaEditorProps) => {
  const [activeTab, setActiveTab] = useState<"plain" | "latex" | "accounting">(formulaType);

  const latexSymbols = [
    { symbol: "\\frac{a}{b}", label: "Fraction" },
    { symbol: "\\sqrt{x}", label: "Square Root" },
    { symbol: "x^{2}", label: "Superscript" },
    { symbol: "x_{i}", label: "Subscript" },
    { symbol: "\\sum", label: "Sum" },
    { symbol: "\\int", label: "Integral" },
    { symbol: "\\alpha", label: "Alpha" },
    { symbol: "\\beta", label: "Beta" },
    { symbol: "\\theta", label: "Theta" },
    { symbol: "\\pi", label: "Pi" },
    { symbol: "\\Delta", label: "Delta" },
    { symbol: "\\infty", label: "Infinity" },
  ];

  const chemicalSymbols = [
    { symbol: "H_{2}O", label: "Water" },
    { symbol: "CO_{2}", label: "Carbon Dioxide" },
    { symbol: "\\rightarrow", label: "Reaction Arrow" },
    { symbol: "\\leftrightharpoons", label: "Equilibrium" },
    { symbol: "^{+}", label: "Positive Charge" },
    { symbol: "^{-}", label: "Negative Charge" },
  ];

  const accountingFormats = [
    { format: "Dr. [Account Name] ... [Amount]", label: "Debit Entry" },
    { format: "Cr. [Account Name] ... [Amount]", label: "Credit Entry" },
    { format: "```\nParticulars | Dr | Cr\n[Item] | [Amount] | -\n```", label: "Journal Entry" },
  ];

  const insertSymbol = (symbol: string) => {
    onChange(value + " " + symbol, activeTab);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plain">
            <Calculator className="h-4 w-4 mr-2" />
            Plain Text
          </TabsTrigger>
          <TabsTrigger value="latex">
            <Beaker className="h-4 w-4 mr-2" />
            LaTeX (Math/Chem)
          </TabsTrigger>
          <TabsTrigger value="accounting">
            <DollarSign className="h-4 w-4 mr-2" />
            Accounting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plain" className="space-y-2">
          <Label>Plain Text</Label>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value, "plain")}
            placeholder="Enter your text here..."
            rows={6}
          />
        </TabsContent>

        <TabsContent value="latex" className="space-y-4">
          <div>
            <Label className="mb-2 block">LaTeX Formula</Label>
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value, "latex")}
              placeholder="Enter LaTeX formula... e.g., E = mc^{2}"
              rows={6}
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Math Symbols</Label>
            <div className="grid grid-cols-4 gap-2">
              {latexSymbols.map((item) => (
                <Button
                  key={item.symbol}
                  variant="outline"
                  size="sm"
                  onClick={() => insertSymbol(item.symbol)}
                  className="text-xs"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chemical Symbols</Label>
            <div className="grid grid-cols-4 gap-2">
              {chemicalSymbols.map((item) => (
                <Button
                  key={item.symbol}
                  variant="outline"
                  size="sm"
                  onClick={() => insertSymbol(item.symbol)}
                  className="text-xs"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <Card className="p-3 bg-muted">
            <Label className="text-xs mb-2 block">Preview</Label>
            <div className="text-sm font-mono">{value || "Preview will appear here..."}</div>
          </Card>
        </TabsContent>

        <TabsContent value="accounting" className="space-y-4">
          <div>
            <Label className="mb-2 block">Accounting Format</Label>
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value, "accounting")}
              placeholder="Enter accounting entry..."
              rows={8}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Formats</Label>
            <div className="space-y-2">
              {accountingFormats.map((item) => (
                <Button
                  key={item.label}
                  variant="outline"
                  size="sm"
                  onClick={() => insertSymbol(item.format)}
                  className="w-full justify-start text-xs"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <Card className="p-3 bg-muted">
            <Label className="text-xs mb-2 block">Preview</Label>
            <pre className="text-xs whitespace-pre-wrap">{value || "Preview will appear here..."}</pre>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
