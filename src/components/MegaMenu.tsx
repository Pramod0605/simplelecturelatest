import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { educationCategories, exploreByGoal, popularSubjects } from "@/data/educationCategories";
import { ChevronDown } from "lucide-react";

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
                          to={`/courses?goal=${goal.slug}`}
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
                    Browse by Class/Exam
                  </h3>
                  <ul className="space-y-3">
                    {educationCategories.slice(0, 4).map((category) => (
                      <li key={category.id}>
                        <Link
                          to={`/courses?category=${category.slug}`}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors block"
                        >
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </Link>
                        <ul className="ml-6 mt-1 space-y-1">
                          {category.subcategories.slice(0, 3).map((sub) => (
                            <li key={sub}>
                              <Link
                                to={`/courses?category=${category.slug}&subcategory=${sub.toLowerCase().replace(/\s+/g, '-')}`}
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

                {/* Column 3: Popular Subjects */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Popular Subjects
                  </h3>
                  <ul className="space-y-2">
                    {popularSubjects.map((subject) => (
                      <li key={subject}>
                        <Link
                          to={`/courses?subject=${subject.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors block py-1"
                        >
                          {subject}
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
