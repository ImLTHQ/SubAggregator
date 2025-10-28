// 常量定义
const 默认订阅路径 = "订阅路径";
const 默认节点地址 = "127.0.0.1";
const 默认节点UUID = "00000000-0000-4000-8000-000000000000";
const 默认节点名称 = "没有可用节点";

// 关键词拆分(防检测)
const 威图锐拆分 = ["v2", "ray"];
const 科拉什拆分 = ["cla", "sh"];
const 维列斯拆分 = ["vl", "ess"];

const 威图锐 = 威图锐拆分.join("");
const 科拉什 = 科拉什拆分.join("");
const 维列斯 = 维列斯拆分.join("");

// 模块状态变量
let 订阅路径 = 默认订阅路径;
let 伪装网页;
let 手动输入列表 = [];

// 网页入口
export default {
  async fetch(访问请求, env) {
    // 初始化环境变量
    this.初始化环境变量(env);
    
    // 解析请求URL
    const 请求URL = new URL(访问请求.url);
    const 路径配置 = this.获取路径配置();
    
    // 检查路径是否匹配
    if (!this.路径是否匹配(请求URL.pathname, 路径配置)) {
      return this.处理伪装网页请求(访问请求, 请求URL) || new Response(null, { status: 404 });
    }
    
    // 生成节点信息并返回对应响应
    const 节点信息列表 = 获取节点信息列表();
    return this.生成响应结果(请求URL.pathname, 路径配置, 节点信息列表, 访问请求);
  },

  初始化环境变量(env) {
    订阅路径 = env.SUB_PATH ?? 默认订阅路径;
    伪装网页 = env.FAKE_WEB || 伪装网页;
    
    // 处理手动输入列表
    if (env.TXT) {
      手动输入列表 = env.TXT.split('\n')
        .map(行 => 行.trim())
        .filter(行 => 行 && 行.includes('#')) // 过滤空行和不符合格式的行
        .map(行 => {
          const [地址, uuid] = 行.split('#').map(项 => 项.trim());
          return { 地址, uuid };
        })
        .filter(项 => 项.地址 && 项.uuid); // 确保地址和UUID都存在
    }
  },
  
  获取路径配置() {
    return {
      威图锐路径: `/${encodeURIComponent(订阅路径)}/${威图锐}`,
      科拉什路径: `/${encodeURIComponent(订阅路径)}/${科拉什}`,
      通用订阅路径: `/${encodeURIComponent(订阅路径)}`,
    };
  },

  路径是否匹配(当前路径, 路径配置) {
    return 当前路径 === 路径配置.威图锐路径 ||
           当前路径 === 路径配置.科拉什路径 ||
           当前路径 === 路径配置.通用订阅路径;
  },

  async 处理伪装网页请求(访问请求, 请求URL) {
    if (!伪装网页) return null;

    try {
      // 构建目标URL
      const 目标基础URL = 伪装网页.startsWith('https://') 
        ? 伪装网页 
        : `https://${伪装网页}`;
      const 目标URL = new URL(目标基础URL);
      目标URL.pathname = 请求URL.pathname;
      目标URL.search = 请求URL.search;

      // 转发请求
      const 转发请求 = new Request(目标URL.toString(), {
        method: 访问请求.method,
        headers: 访问请求.headers,
        body: 访问请求.body,
      });

      return await fetch(转发请求);
    } catch {
      return new Response(null, { status: 404 });
    }
  },

  生成响应结果(当前路径, 路径配置, 节点信息列表, 访问请求) {
    if (当前路径 === 路径配置.威图锐路径) {
      return 生成威图锐配置文件(节点信息列表);
    } else if (当前路径 === 路径配置.科拉什路径) {
      return 生成科拉什配置文件(节点信息列表);
    } else if (当前路径 === 路径配置.通用订阅路径) {
      const 用户代理 = 访问请求.headers.get("User-Agent")?.toLowerCase() || "";
      const 配置生成器 = {
        [威图锐]: () => 生成威图锐配置文件(节点信息列表),
        [科拉什]: () => 生成科拉什配置文件(节点信息列表),
        提示: () => 生成提示界面()
      };
      
      // 根据用户代理选择生成器
      const 匹配工具 = Object.keys(配置生成器).find(工具 => 用户代理.includes(工具));
      return 配置生成器[匹配工具 || '提示']();
    }
    
    return new Response(null, { status: 404 });
  }
};

function 获取节点信息列表() {
  // 收集所有节点信息
  let 所有节点 = [];
  
  // 添加手动输入的节点
  手动输入列表.forEach(({地址, uuid}) => {
    所有节点.push({
      地址,
      uuid,
      节点名称: `节点-${所有节点.length + 1}`
    });
  });

  // 处理空节点情况
  if (所有节点.length === 0) {
    return [{
      地址: 默认节点地址,
      uuid: 默认节点UUID,
      节点名称: 默认节点名称
    }];
  }

  // 统计地址出现次数
  const 地址出现次数 = new Map();
  所有节点.forEach(节点 => {
    地址出现次数.set(节点.地址, (地址出现次数.get(节点.地址) || 0) + 1);
  });

  // 过滤出只出现一次的地址（重复地址全部移除）
  const 去重后节点 = [];
  所有节点.forEach(节点 => {
    if (地址出现次数.get(节点.地址) === 1) {
      // 重新编号节点名称
      节点.节点名称 = `节点-${去重后节点.length + 1}`;
      去重后节点.push(节点);
    }
  });

  // 处理去重后无节点的情况
  return 去重后节点.length > 0 ? 去重后节点 : [{
    地址: 默认节点地址,
    uuid: 默认节点UUID,
    节点名称: 默认节点名称
  }];
}

function 生成提示界面() {
  const 界面内容 = `
<title>订阅-${订阅路径}</title>
<style>
  body {
    font-size: 25px;
    text-align: center;
    margin: 0;
    padding: 0;
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden;
  }
  
  strong {
    max-width: 90%;
    word-wrap: break-word;
  }
</style>
<strong>请把链接导入 ${科拉什} 或 ${威图锐}</strong>
`;

  return new Response(界面内容, {
    status: 200,
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

function 生成威图锐配置文件(节点信息列表) {
  const 配置内容 = 节点信息列表
    .map(({ 地址, uuid, 节点名称 }) => 
      `${维列斯}://${uuid}@${地址}:443?encryption=none&security=tls&sni=${地址}&fp=chrome&type=ws&host=${地址}#${节点名称}`
    )
    .join("\n");

  return new Response(配置内容, {
    status: 200,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
}

function 生成科拉什配置文件(节点信息列表) {
  const 生成单个节点配置 = (节点) => {
    const { 地址, uuid, 节点名称 } = 节点;
    return {
      节点配置: `- name: ${节点名称}
  type: ${维列斯}
  server: ${地址}
  port: 443
  uuid: ${uuid}
  udp: true
  tls: true
  sni: ${地址}
  network: ws
  ws-opts:
    headers:
      Host: ${地址}
      User-Agent: Chrome`,
      代理配置: `    - ${节点名称}`
    };
  };

  const 节点配置列表 = 节点信息列表.map(生成单个节点配置);
  const 节点配置内容 = 节点配置列表.map(项 => 项.节点配置).join("\n");
  const 代理配置内容 = 节点配置列表.map(项 => 项.代理配置).join("\n");

  const 配置内容 = `
proxies:
${节点配置内容}

proxy-groups:
- name: 海外规则
  type: select
  proxies:
    - 延迟优选
    - 故障转移
    - DIRECT
    - REJECT
${代理配置内容}
- name: 国内规则
  type: select
  proxies:
    - DIRECT
    - 延迟优选
    - 故障转移
    - REJECT
${代理配置内容}
- name: 广告屏蔽
  type: select
  proxies:
    - REJECT
    - DIRECT
    - 延迟优选
    - 故障转移
${代理配置内容}
- name: 延迟优选
  type: url-test
  url: https://www.google.com/generate_204
  interval: 30
  tolerance: 50
  proxies:
${代理配置内容}
- name: 故障转移
  type: fallback
  url: https://www.google.com/generate_204
  interval: 30
  proxies:
${代理配置内容}

rules:
  - GEOSITE,category-ads-all,广告屏蔽
  - GEOSITE,cn,国内规则
  - GEOIP,CN,国内规则,no-resolve
  - MATCH,海外规则
`;

  return new Response(配置内容, {
    status: 200,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
}