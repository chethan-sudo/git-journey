import { useEffect, useMemo, useState } from "react";
import "@/App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Check,
  ListChecks,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_OPTIONS = ["pending", "in-progress", "completed"];
const PRIORITY_OPTIONS = ["low", "medium", "high"];

const pageMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

const formatDate = (value) => {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const getStatusStyle = (status) => {
  if (status === "completed") return "bg-emerald-200 text-emerald-900";
  if (status === "in-progress") return "bg-amber-200 text-amber-900";
  return "bg-slate-200 text-slate-900";
};

const getPriorityStyle = (priority) => {
  if (priority === "high") return "bg-red-200 text-red-900";
  if (priority === "low") return "bg-blue-200 text-blue-900";
  return "bg-zinc-200 text-zinc-900";
};

const Layout = ({ children }) => {
  const navLinkClass = ({ isActive }) =>
    `nav-link ${isActive ? "nav-link-active" : ""}`;

  return (
    <div className="app-shell">
      <header
        className="border-b border-border bg-card/90 backdrop-blur"
        data-testid="main-header"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center border border-border bg-background text-xl font-black"
              data-testid="logo-block"
            >
              TG
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
                data-testid="logo-kicker"
              >
                Task Grid
              </p>
              <p className="text-2xl font-black tracking-tight" data-testid="logo-title">
                Todo Grid
              </p>
            </div>
          </div>
          <nav
            className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase"
            data-testid="primary-navigation"
          >
            <NavLink to="/" className={navLinkClass} data-testid="nav-home-link">
              Board
            </NavLink>
            <NavLink
              to="/new"
              className={navLinkClass}
              data-testid="nav-new-link"
            >
              New
            </NavLink>
            <NavLink
              to="/insights"
              className={navLinkClass}
              data-testid="nav-insights-link"
            >
              Insights
            </NavLink>
          </nav>
        </div>
      </header>
      <main data-testid="app-main">{children}</main>
    </div>
  );
};

const Home = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/todos`);
      setTodos(response.data);
      setError("");
    } catch (err) {
      setError("Unable to load todos. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      const matchesStatus =
        statusFilter === "all" || todo.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || todo.priority === priorityFilter;
      const matchesSearch =
        todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (todo.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [todos, statusFilter, priorityFilter, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: todos.length,
      completed: todos.filter((todo) => todo.status === "completed").length,
      pending: todos.filter((todo) => todo.status === "pending").length,
      inProgress: todos.filter((todo) => todo.status === "in-progress").length,
      high: todos.filter((todo) => todo.priority === "high").length,
    };
  }, [todos]);

  const handleToggle = async (todo) => {
    const nextStatus = todo.status === "completed" ? "pending" : "completed";
    await axios.put(`${API}/todos/${todo.id}`, { status: nextStatus });
    fetchTodos();
  };

  const handleDelete = async (todoId) => {
    await axios.delete(`${API}/todos/${todoId}`);
    fetchTodos();
  };

  return (
    <motion.section
      {...pageMotion}
      className="section-block"
      data-testid="home-page"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground"
              data-testid="home-kicker"
            >
              Command surface
            </p>
            <h1
              className="mt-3 text-5xl font-black uppercase tracking-tighter md:text-7xl"
              data-testid="home-title"
            >
              Todo Control Grid
            </h1>
          </div>
          <NavLink
            to="/new"
            className="primary-button"
            data-testid="home-new-todo-link"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Todo
          </NavLink>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
          <div
            className="bento-card md:col-span-8 md:row-span-2"
            data-testid="todo-board-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2
                  className="text-3xl font-bold tracking-tight"
                  data-testid="todo-board-title"
                >
                  Active Board
                </h2>
                <p className="mt-2 text-sm text-muted-foreground" data-testid="todo-board-subtitle">
                  Your tasks, filtered and ready for action.
                </p>
              </div>
              <button
                className="outline-button"
                onClick={fetchTodos}
                data-testid="refresh-todos-button"
              >
                Refresh
              </button>
            </div>

            <div className="mt-8 space-y-4" data-testid="todo-list">
              {loading && (
                <p className="text-sm text-muted-foreground" data-testid="todo-loading">
                  Loading todos...
                </p>
              )}
              {error && (
                <p className="text-sm text-destructive" data-testid="todo-error">
                  {error}
                </p>
              )}
              <AnimatePresence>
                {filteredTodos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="todo-item"
                    data-testid={`todo-item-${todo.id}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p
                          className="text-xl font-semibold"
                          data-testid={`todo-title-${todo.id}`}
                        >
                          {todo.title}
                        </p>
                        {todo.description && (
                          <p
                            className="mt-2 text-sm text-muted-foreground"
                            data-testid={`todo-description-${todo.id}`}
                          >
                            {todo.description}
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase">
                          <span
                            className={`badge ${getStatusStyle(todo.status)}`}
                            data-testid={`todo-status-${todo.id}`}
                          >
                            {todo.status}
                          </span>
                          <span
                            className={`badge ${getPriorityStyle(todo.priority)}`}
                            data-testid={`todo-priority-${todo.id}`}
                          >
                            {todo.priority} priority
                          </span>
                          <span className="text-muted-foreground" data-testid={`todo-due-${todo.id}`}>
                            {formatDate(todo.due_date)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="ghost-button"
                          onClick={() => handleToggle(todo)}
                          aria-label="Toggle status"
                          data-testid={`todo-toggle-${todo.id}`}
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <NavLink
                          to={`/edit/${todo.id}`}
                          className="ghost-button"
                          aria-label="Edit todo"
                          data-testid={`todo-edit-${todo.id}`}
                        >
                          <PencilLine className="h-4 w-4" aria-hidden="true" />
                        </NavLink>
                        <button
                          className="ghost-button"
                          onClick={() => handleDelete(todo.id)}
                          aria-label="Delete todo"
                          data-testid={`todo-delete-${todo.id}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!loading && !filteredTodos.length && (
                <div className="empty-state" data-testid="todo-empty">
                  <ListChecks className="h-6 w-6" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    No todos match this filter yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bento-card md:col-span-4" data-testid="filters-card">
            <h3 className="text-2xl font-bold" data-testid="filters-title">
              Filters
            </h3>
            <div className="mt-6 space-y-4">
              <div>
                <label className="form-label" data-testid="search-label">
                  Search
                </label>
                <input
                  className="form-input"
                  placeholder="Search title or note"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  data-testid="search-input"
                />
              </div>
              <div>
                <label className="form-label" data-testid="status-filter-label">
                  Status
                </label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  data-testid="status-filter"
                >
                  <option value="all">All</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" data-testid="priority-filter-label">
                  Priority
                </label>
                <select
                  className="form-select"
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                  data-testid="priority-filter"
                >
                  <option value="all">All</option>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div
            className="bento-card md:col-span-4 md:row-span-2"
            data-testid="summary-card"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold" data-testid="summary-title">
                Snapshot
              </h3>
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="mt-8 space-y-6">
              <div>
                <p className="stat-number" data-testid="summary-total">
                  {stats.total}
                </p>
                <p className="stat-label" data-testid="summary-total-label">
                  Total tasks
                </p>
              </div>
              <div>
                <p className="stat-number" data-testid="summary-completed">
                  {stats.completed}
                </p>
                <p className="stat-label" data-testid="summary-completed-label">
                  Completed
                </p>
              </div>
              <div>
                <p className="stat-number" data-testid="summary-pending">
                  {stats.pending}
                </p>
                <p className="stat-label" data-testid="summary-pending-label">
                  Pending
                </p>
              </div>
              <div>
                <p className="stat-number" data-testid="summary-high-priority">
                  {stats.high}
                </p>
                <p className="stat-label" data-testid="summary-high-priority-label">
                  High priority
                </p>
              </div>
            </div>
            <NavLink
              to="/insights"
              className="outline-button mt-10 w-full justify-center"
              data-testid="summary-insights-link"
            >
              View insights
            </NavLink>
          </div>

          <div className="bento-card md:col-span-8" data-testid="cta-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                  Next action
                </p>
                <h3 className="mt-2 text-3xl font-bold" data-testid="cta-title">
                  Build the next decisive task.
                </h3>
              </div>
              <NavLink to="/new" className="primary-button" data-testid="cta-new-todo">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Draft new todo
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const NewTodo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    status: "pending",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await axios.post(`${API}/todos`, formData);
      navigate("/");
    } catch (err) {
      setError("Unable to save todo. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section {...pageMotion} className="section-block" data-testid="new-page">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-black uppercase tracking-tighter md:text-6xl" data-testid="new-title">
          New Todo
        </h1>
        <p className="mt-4 text-lg text-muted-foreground" data-testid="new-subtitle">
          Define the next mission with clarity and precision.
        </p>

        <form className="form-card" onSubmit={handleSubmit} data-testid="new-form">
          <div>
            <label className="form-label" data-testid="title-label">
              Title
            </label>
            <input
              className="form-input"
              value={formData.title}
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="Write the task title"
              required
              data-testid="title-input"
            />
          </div>
          <div>
            <label className="form-label" data-testid="description-label">
              Description
            </label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder="Add the supporting detail"
              rows={4}
              data-testid="description-input"
            />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="form-label" data-testid="due-date-label">
                Due date
              </label>
              <input
                type="date"
                className="form-input"
                value={formData.due_date}
                onChange={(event) => handleChange("due_date", event.target.value)}
                data-testid="due-date-input"
              />
            </div>
            <div>
              <label className="form-label" data-testid="priority-label">
                Priority
              </label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(event) => handleChange("priority", event.target.value)}
                data-testid="priority-select"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" data-testid="status-label">
                Status
              </label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(event) => handleChange("status", event.target.value)}
                data-testid="status-select"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive" data-testid="new-error">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
              data-testid="new-submit"
            >
              {saving ? "Saving..." : "Create todo"}
            </button>
            <NavLink to="/" className="outline-button" data-testid="new-cancel">
              Cancel
            </NavLink>
          </div>
        </form>
      </div>
    </motion.section>
  );
};

const EditTodo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    status: "pending",
  });

  const fetchTodo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/todos/${id}`);
      setFormData({
        title: response.data.title || "",
        description: response.data.description || "",
        due_date: response.data.due_date || "",
        priority: response.data.priority || "medium",
        status: response.data.status || "pending",
      });
      setError("");
    } catch (err) {
      setError("Todo not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodo();
  }, [id]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.put(`${API}/todos/${id}`, formData);
      navigate("/");
    } catch (err) {
      setError("Unable to update todo.");
    }
  };

  return (
    <motion.section {...pageMotion} className="section-block" data-testid="edit-page">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-black uppercase tracking-tighter md:text-6xl" data-testid="edit-title">
          Edit Todo
        </h1>
        <p className="mt-4 text-lg text-muted-foreground" data-testid="edit-subtitle">
          Tune the details until it feels precise.
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground" data-testid="edit-loading">
            Loading todo...
          </p>
        ) : (
          <form className="form-card" onSubmit={handleSubmit} data-testid="edit-form">
            <div>
              <label className="form-label" data-testid="edit-title-label">
                Title
              </label>
              <input
                className="form-input"
                value={formData.title}
                onChange={(event) => handleChange("title", event.target.value)}
                required
                data-testid="edit-title-input"
              />
            </div>
            <div>
              <label className="form-label" data-testid="edit-description-label">
                Description
              </label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(event) => handleChange("description", event.target.value)}
                rows={4}
                data-testid="edit-description-input"
              />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="form-label" data-testid="edit-due-date-label">
                  Due date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.due_date}
                  onChange={(event) => handleChange("due_date", event.target.value)}
                  data-testid="edit-due-date-input"
                />
              </div>
              <div>
                <label className="form-label" data-testid="edit-priority-label">
                  Priority
                </label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(event) => handleChange("priority", event.target.value)}
                  data-testid="edit-priority-select"
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" data-testid="edit-status-label">
                  Status
                </label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(event) => handleChange("status", event.target.value)}
                  data-testid="edit-status-select"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive" data-testid="edit-error">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="primary-button" data-testid="edit-submit">
                Save changes
              </button>
              <NavLink to="/" className="outline-button" data-testid="edit-cancel">
                Cancel
              </NavLink>
            </div>
          </form>
        )}
      </div>
    </motion.section>
  );
};

const Insights = () => {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/todos/summary`);
      setSummary(response.data);
      setError("");
    } catch (err) {
      setError("Unable to load insights.");
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <motion.section {...pageMotion} className="section-block" data-testid="insights-page">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-black uppercase tracking-tighter md:text-6xl" data-testid="insights-title">
          Insights
        </h1>
        <p className="mt-4 text-lg text-muted-foreground" data-testid="insights-subtitle">
          Big, bold numbers for decisive planning.
        </p>

        {error && (
          <p className="mt-6 text-sm text-destructive" data-testid="insights-error">
            {error}
          </p>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="bento-card md:col-span-8" data-testid="insights-poster">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <p className="stat-number" data-testid="insights-total">
                  {summary ? summary.total : "—"}
                </p>
                <p className="stat-label" data-testid="insights-total-label">
                  Total tasks
                </p>
              </div>
              <div>
                <p className="stat-number" data-testid="insights-completed">
                  {summary ? summary.completed : "—"}
                </p>
                <p className="stat-label" data-testid="insights-completed-label">
                  Completed
                </p>
              </div>
              <div>
                <p className="stat-number" data-testid="insights-pending">
                  {summary ? summary.pending : "—"}
                </p>
                <p className="stat-label" data-testid="insights-pending-label">
                  Pending
                </p>
              </div>
              <div>
                <p className="stat-number" data-testid="insights-in-progress">
                  {summary ? summary.in_progress : "—"}
                </p>
                <p className="stat-label" data-testid="insights-in-progress-label">
                  In progress
                </p>
              </div>
            </div>
          </div>
          <div className="bento-card md:col-span-4" data-testid="insights-priority">
            <h3 className="text-2xl font-bold" data-testid="insights-priority-title">
              Priority split
            </h3>
            <div className="mt-8 space-y-6">
              <div>
                <p className="stat-number" data-testid="insights-high">
                  {summary ? summary.high_priority : "—"}
                </p>
                <p className="stat-label" data-testid="insights-high-label">
                  High priority
                </p>
              </div>
              <div>
                <p className="stat-number" data-testid="insights-medium">
                  {summary ? summary.medium_priority : "—"}
                </p>
                <p className="stat-label" data-testid="insights-medium-label">
                  Medium priority
                </p>
              </div>
              <div>
                <p className="stat-number" data-testid="insights-low">
                  {summary ? summary.low_priority : "—"}
                </p>
                <p className="stat-label" data-testid="insights-low-label">
                  Low priority
                </p>
              </div>
            </div>
            <button
              className="outline-button mt-8 w-full justify-center"
              onClick={fetchSummary}
              data-testid="insights-refresh"
            >
              Refresh insights
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

function App() {
  return (
    <div className="App" data-testid="app-root">
      <BrowserRouter>
        <Layout>
          <AnimatedRoutes />
        </Layout>
      </BrowserRouter>
      <div className="app-noise" aria-hidden="true" data-testid="noise-overlay" />
    </div>
  );
}

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewTodo />} />
        <Route path="/edit/:id" element={<EditTodo />} />
        <Route path="/insights" element={<Insights />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
