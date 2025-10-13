import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SEOHead } from "@/components/SEO";
import { BottomNav } from "@/components/mobile/BottomNav";
import { HamburgerMenu } from "@/components/mobile/HamburgerMenu";
import { mockCategories } from "@/data/mockCategories";

const MobileExplore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<typeof mockCategories[0] | null>(null);

  return (
    <>
      <SEOHead title="Explore | SimpleLecture" description="Explore courses and categories" />
      
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <HamburgerMenu />
              <h1 className="font-semibold text-lg">Explore</h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="p-4">
          <h2 className="font-semibold text-lg mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 gap-4">
            {mockCategories.map((category) => (
              <Sheet key={category.id}>
                <SheetTrigger asChild>
                  <button
                    className="text-left"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div
                      className={`aspect-square rounded-lg p-6 flex flex-col items-center justify-center bg-gradient-to-br ${category.color} text-white hover:shadow-lg transition-shadow`}
                    >
                      <span className="text-4xl mb-2">{category.icon}</span>
                      <h3 className="font-semibold text-center text-sm">{category.name}</h3>
                      <p className="text-xs opacity-90 mt-1">{category.courseCount} courses</p>
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[70vh]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      {category.name}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="py-6 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">Subcategories</h3>
                    {category.subcategories.map((subcategory) => (
                      <Link
                        key={subcategory}
                        to={`/mobile/programs?category=${category.slug}&subcategory=${subcategory.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block p-4 bg-muted rounded-lg hover:bg-accent transition-colors"
                      >
                        <h4 className="font-medium text-sm">{subcategory}</h4>
                      </Link>
                    ))}
                    <Link
                      to={`/mobile/programs?category=${category.slug}`}
                      className="block p-4 bg-primary text-primary-foreground rounded-lg text-center font-medium hover:bg-primary/90 transition-colors"
                    >
                      View All {category.name} Courses
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            ))}
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default MobileExplore;
