import React from 'react';
import { Button, Modal, Table, Icon, Transfer, Form } from 'antd';
import QueueAnim from 'rc-queue-anim';
import TdCard from '../../../component/TdCard';
import { openNotice, buildTableTip } from '../../../common/antdUtil';
import { url } from '../../../config/server';
import { rspInfo } from '../../../common/authConstant';
import { callAjax, getLoginInfo } from '../../../common/util';
import { filterObject } from '../../../common/util';
import TdPageTable from '../../../component/TdPageTable';
import ProjectManageSearchForm from './ProjectManageSearchForm';
import ProjectManageEditForm from './ProjectManageEditForm';
import ProjectMemberAppend from './ProjectMemberAppend';
import ProjectMemberInfo from './ProjectMemberInfo';
const confirm = Modal.confirm;

class ProjectManage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      modalTitle: '',
      tdTableReload: false,
      tdTableParam: {},
      formReset: false,
      formData: {},
      tableSelectedRows: [],
      tableSelectedRowKeys: [],
      confirmLoading: false,
      tableLoading: false,
      editType: '1',
      appendVisible: false,
      infoVisible: false,
      project: '',
      proName: '',
      projectName: '',
      call: false,
    };
  }

  handleFormSubmit(data) {
    getLoginInfo();
    console.log(data);
    this.setState({
      tdTableReload: true,
      tdTableParam: data,
      tableSelectedRows: [],
    }, () => {
      this.setState({
        tdTableReload: false,
      });
    });
  }

  handleFormReset() {
    this.setState({
      tableSelectedRows: [],
      tableSelectedRowKeys: [],
    });
  }

  // 添加用户
  handleAddBtnClick() {
    this.setState({
      formData: {},
      modalVisible: true,
      modalTitle: '创建新项目',
      editType: '1',
    }, () => {
      // 重置子组件表单数据
      this.setState({ formReset: true }, () => {
        // 将子组件表单重置标识置为false
        this.setState({
          formReset: false,
        });
      });
    });
  }

  // 修改用户
  handlerEditBtnClick() {
    if (this.state.tableSelectedRows.length === 1) {
      // const info = getLoginInfo();
      // if (info.userId === this.state.tableSelectedRowKeys[0]) {
      //   openNotice('warning', '不能修改当前用户', '提示');
      //   return;
      // }
      this.setState({
        formData: this.state.tableSelectedRows[0],
        modalVisible: true,
        modalTitle: '修改项目信息',
        editType: '2',
      }, () => {
        // 重置子组件表单数据
        this.setState({ formReset: true }, () => {
          // 将子组件表单重置标识置为false
          this.setState({
            formReset: false,
          });
        });
      });
    } else if (this.state.tableSelectedRows.length > 1) {
      openNotice('warning', '不能同时选择多条用户记录', '提示');
      console.log('删除数据', this.state.tableSelectedRowKeys, this.state.tableSelectedRows);
    } else {
      openNotice('warning', '请选择要修改的用户记录', '提示');
    }
  }

  handlerRowSelect(selectedRowKeys, selectedRows) {
    this.setState({
      tableSelectedRows: selectedRows,
      tableSelectedRowKeys: selectedRowKeys,
    });
  }

  // 删除用户
  handlerDeleteBtnClick() {
    if (this.state.tableSelectedRows.length > 0) {
      console.log('删除数据', this.state.tableSelectedRowKeys, this.state.tableSelectedRows);
      const proId = this.state.tableSelectedRowKeys[0];
      const obj = this;
      confirm({
        title: '删除',
        content: '您是否确认要删除选中项目 ?',
        onOk() {
          console.log('onOk');
          const opt = {
            url: url.project.delete,
            type: 'POST',
            data: { proId },
          };
          console.log(opt);
          callAjax(opt, (result) => {
            if (result.rspCode === rspInfo.RSP_SUCCESS) {
              openNotice('success', '删除项目记录成功', '提示');
              // 重新加载table数据
              obj.setState({
                tdTableReload: true,
                tableSelectedRowKeys: [],
                tableSelectedRows: [],
              }, () => {
                obj.setState({
                  tdTableReload: false,
                });
              });
            } else {
              openNotice('error', result.rspInfo, '提示');
            }
          }, (rep, info, o) => {
            openNotice('error', rspInfo.RSP_NETWORK_ERROR, '提示');
          });
        },
        onCancel() { },
      });
    } else {
      openNotice('warning', '请选择要删除的项目记录', '提示');
    }
  }

  // 模态框确认点击事件，修改子页面props valid状态,触发子页面执行回调
  handleModalOk() {
    this.setState({
      modelIsValid: true,
    }, () => {
      this.setState({ modelIsValid: false });
    });
  }

  // 模态框子页面回调
  callbackValid(editType, errors, data) {
    console.log('callbackValid', data);
    this.setState({
      modelIsValid: false,
    });
    const obj = this;
    if (!!errors) {
      console.log('填写信息有误');
    } else {
      this.setState({
        formData: data,
        formReset: false,
        confirmLoading: true,
      }, () => {
        console.log(editType);
        switch (editType) {
          case '1':
            obj.handleAddModalOk();
            break;
          case '2':
            obj.handlEditModalOk();
            break;
          default:
            openNotice('error', '操作失败');
            break;
        }
      });
    }
  }


  // 添加对话框的确定按钮
  handleAddModalOk() {
    // 获取addUserForm表单数据
    const formData = filterObject(this.state.formData);
    console.log(formData);
    formData.userCreator = getLoginInfo().userId; // 创建人
    const opt = {
      url: url.project.add,
      data: formData,
    };
    const obj = this;
    // 请求后台添加用户接口
    callAjax(opt, (result) => {
      console.log(result);
      if (result.rspCode === rspInfo.RSP_SUCCESS) {
        openNotice('success', '添加项目记录成功, 请及时更新项目配置信息', '提示');
        // obj.props.form.resetFields();
        obj.setState({
          confirmLoading: false,
          modalVisible: !obj.state.modalVisible,
          editType: 0,
          tdTableReload: true,
          tableSelectedRowKeys: [],
          tableSelectedRows: [],
        }, () => {
          obj.setState({
            tdTableReload: false,
          });
        });
      } else {
        openNotice('error', result.rspInfo, '添加项目失败');
        obj.setState({
          confirmLoading: false,
        });
      }
    }, (req, info, o) => {
      openNotice('error', rspInfo.RSP_NETWORK_ERROR, '提示');
      obj.setState({
        confirmLoading: false,
      });
    });
  }
  /**
   * 编辑项目弹出框确定事件
   */
  handlEditModalOk() {
    const formData = filterObject(this.state.formData);
    const opt = {
      url: url.project.update,
      data: formData,
    };
    const obj = this;
    callAjax(opt, (result) => {
      console.log(result);
      if (result.rspCode === rspInfo.RSP_SUCCESS) {
        openNotice('success', '更新项目信息成功', '提示');
        // obj.props.form.resetFields();
        obj.setState({
          confirmLoading: false,
          modalVisible: !obj.state.modalVisible,
          modalOprType: 0,
          tdTableReload: true,
          tableSelectedRowKeys: [],
          tableSelectedRows: [],
        }, () => {
          obj.setState({
            tdTableReload: false,
          });
        });
      } else {
        openNotice('error', result.rspInfo, '提示');
        obj.setState({
          confirmLoading: false,
        });
      }
    }, (req, info, o) => {
      console.log(req, info, o);
      openNotice('error', rspInfo.RSP_NETWORK_ERROR, '提示');
      obj.setState({
        confirmLoading: false,
      });
    });
  }

  handleDetailLinkClick(text, record, key) {
    console.log(record, key);
    this.setState({
      call: true,
      project: record.PRO_ID,
      proName: record.PRO_NAME,
      infoVisible: !this.state.infoVisible,
    }, () => {
      this.setState({
        call: false,
        formReset: true,
      }, () => {
        // 将子组件表单重置标识置为false
        this.setState({
          formReset: false,
        });
      });
    });
  }

  handleAppendLinkClick(text, record, key) {
    console.log(record, key);
    if (record.PRO_USE === '0') {
      openNotice('warning', '请先启用项目', '提示');
      return;
    }
    this.setState({
      call: true,
      project: record.PRO_ID,
      projectName: record.PRO_NAME,
      appendVisible: !this.state.appendVisible,
    }, () => {
      this.setState({
        call: false,
        formReset: true,
      }, () => {
        // 将子组件表单重置标识置为false
        this.setState({
          formReset: false,
        });
      });
    });
  }

  // 将选中的成员用户添加到指定项目
  appendOk(keys, rows) {
    console.log(keys, rows);
    console.log(this.state.project);
    if (keys.length > 0) {
      const value = {
        proId: this.state.project,
        proName: this.state.projectName,
        userCreator: getLoginInfo().userId,
        users: [],
      };
      console.log(value);
      let user = '[';
      for (let i = 0; i < rows.length; i++) {
        user += `{"userId":"${rows[i].USER_ID}","userName":"${rows[i].USER_NAME}"}`;
        if (i < rows.length - 1) {
          user += ',';
        }
      }
      user += ']';
      value.users = user;
      const opt = {
        url: url.project.userAppend,
        data: value,
      };
      const obj = this;
      callAjax(opt, (result) => {
        console.log(result);
        if (result.rspCode === rspInfo.RSP_SUCCESS) {
          openNotice('success', '添加项目成员成功', '提示');
          // obj.props.form.resetFields();
          obj.setState({
            appendVisible: false,
          });
        } else {
          openNotice('error', result.rspInfo, '提示');
        }
      }, (req, info, o) => {
        console.log(req, info, o);
        openNotice('error', rspInfo.RSP_NETWORK_ERROR, '提示');
      });
    } else {
      openNotice('warning', '请选择要添加的纪录', '提示');
    }
  }

  appendNo() {
    this.setState({ appendVisible: false, call: false });
  }

  renderTableList(result) {
    console.log(result);
    if (result.rspCode === rspInfo.RSP_SUCCESS) {
      return { list: result.rspData.list, total: result.rspData.total };
    }
    return {};
  }

  render() {
    // 定义变量和参数
    const obj = this;
    const tableColumns = [
      { title: '项目编号', dataIndex: 'PRO_ID', width: 200, render: (text) => buildTableTip(text, 200) },
      { title: '项目名称', dataIndex: 'PRO_NAME', width: 200, render: (text) => buildTableTip(text, 200) },
      { title: '项目类型', dataIndex: 'TYPE_TEXT', width: 150, render: (text) => buildTableTip(text, 150) },
      {
        title: '是否启动', dataIndex: 'PRO_USE', width: 120, render: (text) => {
          return (
            <span>
              {text === '0' ? <font color="#FF4500">禁用</font> : <font color="#00CD00">启用</font>}
            </span>
          );
        },
      },
      { title: '项目描述', dataIndex: 'PRO_DES', width: 180, render: (text) => buildTableTip(text, 180) },
      { title: '项目组长', dataIndex: 'PRO_LEADER', width: 120, render: (text) => buildTableTip(text, 120) },
      { title: '创建时间', dataIndex: 'PRO_CRE_TIME', width: 180, render: (text) => buildTableTip(text, 180) },
      {
        title: '成员', key: 'operation', width: 120, fixed: 'right', render(text, record, key) {
          return (
            <span>
              <a href='javascript:void(0)' onClick={() => { obj.handleDetailLinkClick(text, record, key); } }>成员</a>
              <span className='ant-divider' ></span>
              <a href='javascript:void(0)' onClick={() => { obj.handleAppendLinkClick(text, record, key); } }>添加</a>
            </span>
          );
        },
      },
    ];
    const toolbar = [
      { icon: 'plus', text: '新增', click: () => { obj.handleAddBtnClick(); } },
      { icon: 'edit', text: '修改', click: () => { obj.handlerEditBtnClick(); } },
      { icon: 'delete', text: '删除', click: () => { obj.handlerDeleteBtnClick(); } },
    ];
    // 渲染虚拟DOM
    return (
      <div>
        <TdCard hideHead="true" shadow="true">
          <ProjectManageSearchForm
            onSubmit={this.handleFormSubmit.bind(this)}
            onReset={this.handleFormReset.bind(this)}
          />
          <p className="br" />

          <TdPageTable rowKey={record => record.PRO_ID} scroll={{ x: 1300 }}
            rowSelectCallback={this.handlerRowSelect.bind(this)}
            toolbar={toolbar}
            url={url.project.list}
            loadParam={this.state.tdTableParam}
            reload={this.state.tdTableReload}
            renderResult={this.renderTableList.bind(this)}
            columns={tableColumns}
          />
          <Modal title={this.state.modalTitle} visible={this.state.modalVisible}
            confirmLoading={this.state.confirmLoading}
            onCancel={() => { this.setState({ modalVisible: false }); } }
            onOk={this.handleModalOk.bind(this)}
          >
            <ProjectManageEditForm formReset={this.state.formReset}
              editType={this.state.editType}
              valid={this.state.modelIsValid}
              formData={this.state.formData}
              validCallback={(editType, errors, data) => {
                this.callbackValid(editType, errors, data);
              } }
            />
          </Modal>
          <Modal title="为已创建项目添加成员" visible={this.state.appendVisible}
            onCancel={() => { this.setState({ appendVisible: false, call: false }); } }
            footer={null} width="600"
          >
            <ProjectMemberAppend
              call={this.state.call}
              project={this.state.project}
              formReset={this.state.formReset}
              onOk={this.appendOk.bind(this)}
              onNo={this.appendNo.bind(this)}
            />
          </Modal>
          <Modal title={`${this.state.proName}-成员列表`} visible={this.state.infoVisible}
            onCancel={() => { this.setState({ infoVisible: false, call: false }); } }
            footer={null} width="800"
          >
            <ProjectMemberInfo
              call={this.state.call}
              project={this.state.project}
              formReset={this.state.formReset}
            />
          </Modal>
        </TdCard>
      </div>
    );
  }
}

export default ProjectManage;
