// src/pages/admin/components/notification/NotificationTemplates.jsx
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import adminService from "../../../../services/adminService";
import Button from "../../../../components/ui/Button";
import Modal from "../../../../components/ui/Modal";
import TemplateForm from "./TemplateForm";
import Spinner from "../../../../components/ui/Spinner";

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
        try {
          setIsLoading(true);
          const res = await adminService.getTemplates();
          const data = res?.data;
      
          const items = Array.isArray(data.templates)
            ? data.templates
            : Array.isArray(data)
            ? data
            : [];
      
          setTemplates(items);
        } catch (error) {
          toast.error(error.message);
        } finally {
          setIsLoading(false);
        }
      };
      
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (templateData) => {
    try {
      await adminService.createTemplate(templateData);
      toast.success("Template created successfully");
      fetchTemplates();
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdate = async (id, templateData) => {
    try {
      await adminService.updateTemplate(id, templateData);
      toast.success("Template updated successfully");
      fetchTemplates();
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminService.deleteTemplate(id);
      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isLoading) return <Spinner size="lg" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => {
          setCurrentTemplate(null);
          setIsModalOpen(true);
        }}>
          Create Template
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Channel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {templates.map((template) => (
              <tr key={template._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {template.subject}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {template.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {template.channel}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {template.isActive ? "Active" : "Inactive"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setCurrentTemplate(template);
                      setIsModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(template._id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentTemplate ? "Edit Template" : "Create Template"}
      >
        <TemplateForm
          template={currentTemplate}
          onSubmit={currentTemplate ? handleUpdate : handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}