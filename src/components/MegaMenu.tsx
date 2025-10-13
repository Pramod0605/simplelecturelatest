import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { mockCategories } from "@/data/mockCategories";
import { ChevronDown } from "lucide-react";

const exploreByGoal = [
  { name: "Learn AI & GenAI", slug: "learn-ai" },
  { name: "Launch Your Career", slug: "career" },
  { name: "Get Certified", slug: "certifications" },
  { name: "Upskill Your Team", slug: "business" },
  { name: "For Developers", slug: "developers" },
  { name: "For Students", slug: "students" },
];

const popularTopics = [
  "Prompt Engineering",
  "Large Language Models",
  "ChatGPT Mastery",
  "AI Agents",
  "Machine Learning",
  "Data Science",
  "Cyber Security",
  "Web Development",
];

export const MegaMenu = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent hover:bg-accent">
            <span>All Courses</span>
            <ChevronDown className="ml-1 h-4 w-4" />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[800px] p-6">
              <div className="grid grid-cols-3 gap-8">
                {/* Column 1: Explore by Goal */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Explore by Goal
                  </h3>
                  <ul className="space-y-2">
                    {exploreByGoal.map((goal) => (
                      <li key={goal.slug}>
                        <Link
                          to={`/programs?goal=${goal.slug}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors block py-1"
                        >
                          {goal.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2: Categories & Subcategories */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Browse by Category
                  </h3>
                  <ul className="space-y-3">
                    {mockCategories.slice(0, 6).map((category) => (
                      <li key={category.id}>
                        <Link
                          to={`/programs?category=${category.slug}`}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors block"
                        >
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </Link>
                        <ul className="ml-6 mt-1 space-y-1">
                          {category.subcategories.slice(0, 2).map((sub) => (
                            <li key={sub}>
                              <Link
                                to={`/programs?category=${category.slug}&subcategory=${sub.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors block"
                              >
                                {sub}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3: Popular Topics */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Popular Topics
                  </h3>
                  <ul className="space-y-2">
                    {popularTopics.map((topic) => (
                      <li key={topic}>
                        <Link
                          to={`/programs?topic=${topic.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors block py-1"
                        >
                          {topic}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
