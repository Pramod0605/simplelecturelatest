import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useExploreByGoalPublic } from "@/hooks/useExploreByGoalPublic";
import { useCategoriesHierarchy } from "@/hooks/useCategoriesHierarchy";
import { ChevronDown } from "lucide-react";

export const MegaMenu = () => {
  const { data: goals } = useExploreByGoalPublic();
  const { data: categories } = useCategoriesHierarchy();

  const handleGoalClick = (goal: any, e: React.MouseEvent) => {
    if (goal.link_type === 'external' && goal.link_url) {
      e.preventDefault();
      if (goal.open_in_new_tab) {
        window.open(goal.link_url, '_blank');
      } else {
        window.location.href = goal.link_url;
      }
    }
  };

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent hover:bg-accent">
            <span>All Courses</span>
            <ChevronDown className="ml-1 h-4 w-4" />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[1100px] p-6 max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Explore by Goal
                  </h3>
                  <ul className="space-y-2">
                    {goals?.map((goal: any) => (
                      <li key={goal.id}>
                        <Link
                          to={goal.link_type === 'courses' ? `/explore/${goal.slug}` : (goal.link_url || `/explore/${goal.slug}`)}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors block py-1"
                          onClick={(e) => handleGoalClick(goal, e)}
                        >
                          {goal.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Browse by Class/Exam
                  </h3>
                  <ul className="space-y-3">
                    {categories?.slice(0, Math.ceil((categories?.length || 0) / 2)).map((category) => (
                      <li key={category.id}>
                        <Link
                          to={`/programs?category=${category.slug}`}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors block"
                        >
                          <span className="mr-2">{category.icon || "📚"}</span>
                          {category.name}
                        </Link>
                        <ul className="ml-6 mt-1 space-y-1">
                          {category.subcategories.map((sub) => (
                            <li key={sub.id}>
                              <Link
                                to={`/programs?category=${category.slug}&subcategory=${sub.slug}`}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors block"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 invisible">
                    Browse by Class/Exam
                  </h3>
                  <ul className="space-y-3">
                    {categories?.slice(Math.ceil((categories?.length || 0) / 2)).map((category) => (
                      <li key={category.id}>
                        <Link
                          to={`/programs?category=${category.slug}`}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors block"
                        >
                          <span className="mr-2">{category.icon || "📚"}</span>
                          {category.name}
                        </Link>
                        <ul className="ml-6 mt-1 space-y-1">
                          {category.subcategories.map((sub) => (
                            <li key={sub.id}>
                              <Link
                                to={`/programs?category=${category.slug}&subcategory=${sub.slug}`}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors block"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
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
