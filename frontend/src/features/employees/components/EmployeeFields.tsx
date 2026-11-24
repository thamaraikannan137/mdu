import { Form, Input } from 'antd'
import type { InputProps } from 'antd'

const phonePattern = /^\+?[0-9][0-9\s()-]{6,18}$/
const pincodePattern = /^\d{6}$/

export function EmployeeFields() {
  function field(extra?: InputProps) {
    return <Input {...extra} />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-6">
      <Form.Item className="!mb-4" label="Name" name="name" rules={[{ required: true }]}>
        {field()}
      </Form.Item>
      <Form.Item className="!mb-4" label="Job title" name="job_title" rules={[{ required: true }]}>
        {field()}
      </Form.Item>
      <Form.Item className="!mb-4" label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
        {field({ autoComplete: 'off' })}
      </Form.Item>
      <Form.Item
        className="!mb-4"
        label="Phone"
        name="phone"
        rules={[{ required: true, pattern: phonePattern, message: 'Enter a valid phone number' }]}
      >
        {field({ inputMode: 'tel', autoComplete: 'tel' })}
      </Form.Item>
      <Form.Item className="!mb-4 md:col-span-2" label="Address" name="address" rules={[{ required: true }]}>
        {field()}
      </Form.Item>
      <Form.Item className="!mb-4" label="City" name="city" rules={[{ required: true }]}>
        {field()}
      </Form.Item>
      <Form.Item className="!mb-4" label="State" name="state" rules={[{ required: true }]}>
        {field()}
      </Form.Item>
      <Form.Item className="!mb-4" label="Country" name="country" rules={[{ required: true }]}>
        {field()}
      </Form.Item>
      <Form.Item
        className="!mb-4"
        label="Pincode"
        name="pincode"
        rules={[{ required: true, pattern: pincodePattern, message: 'Enter a 6 digit pincode' }]}
      >
        {field({ inputMode: 'numeric', maxLength: 6 })}
      </Form.Item>
    </div>
  )
}
