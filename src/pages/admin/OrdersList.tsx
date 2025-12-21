import { useState } from 'react';
import { useAdminOrders, OrderItem } from '@/hooks/useAdminOrders';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR } from '@/lib/utils';
import { format } from 'date-fns';
import { Search, Eye, Package, CreditCard } from 'lucide-react';

const OrdersList = () => {
  const { data: orders, isLoading } = useAdminOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const filteredOrders = orders?.filter(order => {
    const query = searchQuery.toLowerCase();
    return (
      order.order_id?.toLowerCase().includes(query) ||
      order.student_name?.toLowerCase().includes(query) ||
      order.student_email?.toLowerCase().includes(query) ||
      order.courses.some(c => c.name.toLowerCase().includes(query))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">View and manage all student enrollments and orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-semibold">{orders?.length || 0} Orders</span>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, student name, email, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.order_id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.student_name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{order.student_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.courses.slice(0, 2).map((course, idx) => (
                        <div key={idx} className="text-sm">{course.name}</div>
                      ))}
                      {order.courses.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{order.courses.length - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-semibold">{formatINR(order.final_amount)}</div>
                      {order.discount_amount && order.discount_amount > 0 && (
                        <div className="text-xs text-green-600">
                          -{formatINR(order.discount_amount)} discount
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Order Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono font-semibold">{selectedOrder.order_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Date</p>
                  <p>{format(new Date(selectedOrder.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Gateway</p>
                  <p className="capitalize">{selectedOrder.payment_gateway || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Student Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p>{selectedOrder.student_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{selectedOrder.student_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p>{selectedOrder.student_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p>
                      {[
                        selectedOrder.metadata?.customerInfo?.city,
                        selectedOrder.metadata?.customerInfo?.state
                      ].filter(Boolean).join(', ') || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Courses Purchased</h4>
                <div className="space-y-2">
                  {selectedOrder.courses.map((course, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span>{course.name}</span>
                      <span className="font-semibold">{formatINR(course.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatINR(selectedOrder.amount_inr)}</span>
                  </div>
                  {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount {selectedOrder.metadata?.promoCode && `(${selectedOrder.metadata.promoCode})`}</span>
                      <span>-{formatINR(selectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Paid</span>
                    <span>{formatINR(selectedOrder.final_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersList;
